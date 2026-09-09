class SessionBuilder
  # Bounds the wait on a rival's uncommitted index entry; nothing else does.
  LOCK_TIMEOUT = '3s'.freeze

  attr_reader :user

  def initialize(session_data, photos, user)
    @session_data = session_data
    @user = user
    @photos = photos
  end

  def build!
    data = @session_data.clone

    data[:notes_attributes] =
      SessionBuilder.prepare_notes(data.delete(:notes), @photos)
    data[:tag_list] = SessionBuilder.normalize_tags(data[:tag_list])
    data[:user] = @user
    stream_data = data.delete(:streams)

    data = build_local_start_and_end_time(data)
    data[:time_zone] = time_zone_for(data)

    allowed = Session.attribute_names + %w[notes_attributes tag_list user]
    filtered = data.select { |k, _| allowed.include?(k.to_s) }

    # Insert and let the unique index on LOWER(uuid) refuse us, rather than asking
    # first — the answer to "is this uuid free?" is stale by the time it is given.
    # A late retry never gets this far: the uniqueness validation catches it and
    # returns the 400 this path has always returned.
    #
    # `jobs` is bound to the transaction's return value, so a rolled-back attempt
    # cannot leave streams queued for measurements with no stream to belong to.
    session, jobs =
      begin
        # requires_new: without a SAVEPOINT the violation poisons a caller's
        # transaction, and reusable_session's SELECT raises
        # PG::InFailedSqlTransaction instead of returning the winner's row.
        ActiveRecord::Base.transaction(requires_new: true) do
          # Without this an INSERT meeting a rival's uncommitted index entry waits
          # for that transaction with no bound — a puma thread parked on someone
          # else's slow upload. This is what the advisory lock used to provide.
          # SET LOCAL is transaction-scoped, not savepoint-scoped, so setting it
          # inside a caller's transaction leaves them a lock_timeout they never
          # asked for. open_transactions == 1 identifies the outermost one;
          # transaction_open? is true either way, since it sees our own.
          if ActiveRecord::Base.connection.open_transactions == 1
            ActiveRecord::Base.connection.execute("SET LOCAL lock_timeout = '#{LOCK_TIMEOUT}'")
          end

          created = Session.create!(filtered)

          built =
            stream_data.values.filter_map do |a_stream|
              measurements = a_stream.delete(:measurements)
              next unless measurements.any?
              a_stream.merge!(session: created)
              [Stream.build_with_threshold_set!(a_stream), measurements]
            end

          [created, built]
        end
      rescue ActiveRecord::RecordNotUnique
        # The winner created it; this request contributes nothing further. Re-raised
        # for any other constraint, or a row this path could not have produced.
        [reusable_session(data, filtered) || raise, []]
      end

    jobs.each do |(stream, measurements)|
      MeasurementsCreator.new.call(stream, measurements)
    end

    session
  rescue ActiveRecord::RecordInvalid => invalid
    Rails.logger.warn("[SessionBuilder] data: #{data}")
    Rails.logger.warn(invalid.record.errors.full_messages)
    nil
  rescue ActiveRecord::LockWaitTimeout
    # Same answer as an invalid session: 400, and the app retries on its next sync.
    Rails.logger.warn("[SessionBuilder] uuid insert timed out for #{data[:uuid]}")
    nil
  rescue ActiveRecord::RecordNotUnique => e
    # Not a session we may reuse — another constraint, another user's row, or a
    # different recording. 400, as this path has always answered.
    Rails.logger.warn("[SessionBuilder] uuid conflict for #{data[:uuid]}: #{e.message}")
    nil
  end

  # The row the winner of a race committed, or nil when this request must not be
  # handed it. Both this and FixedSessions::Creator follow one rule: only hand back
  # a row this path could have produced itself, carrying what this request uploaded.
  def reusable_session(data, filtered)
    # LOWER() because the uniqueness rules are case-insensitive, and so is the index
    # that just refused us. Scoped to the user first, so that index does the work.
    existing =
      @user.sessions
           .where('LOWER(sessions.uuid) = ?', data[:uuid].to_s.downcase)
           .where(type: data[:type])
           .first

    return nil if existing.nil?

    # A session_token means the row came from the v3 fixed create and is bound to
    # one AirBeam over BLE. Handing it to a legacy client would put two devices on
    # one session's streams — silent data mixing, worse than the 400 instead.
    # Nothing on this path sets one, so mobile uploads never reach it.
    return nil if existing.session_token.present?

    # Losing the race proves two requests overlapped on this uuid, not that they
    # carry the same recording — a client reusing a uuid for a *different* session
    # would otherwise be handed the earlier one's location, silently discarding
    # what it just uploaded. So this errs wide: every field that cannot legitimately
    # differ between two uploads of one recording is compared, because adding one
    # can only turn a silent discard into the 400 this path returned before.
    #
    # Streams and measurement counts are excluded on purpose: the winner commits
    # session and streams while Sidekiq is still inserting measurements, so it
    # legitimately reads zero. Everything below is written in that transaction.
    #
    # notes_attributes is dropped because building it constructs a Note per note and
    # registers an ActiveStorage attachment change for each, and those call
    # blob.identify_without_saving — a storage download per unidentified blob.
    candidate = Session.new(filtered.except(:notes_attributes))

    # uniq on both sides: normalize_tags turns "beach beach" into "beach,beach"
    # while the stored row reads back one tagging. TagList happens to dedup on
    # assignment today; this keeps the comparison from depending on that.
    same_recording =
      existing.title == candidate.title &&
      existing.start_time_local == candidate.start_time_local &&
      existing.end_time_local == candidate.end_time_local &&
      existing.time_zone == candidate.time_zone &&
      existing.contribute == candidate.contribute &&
      existing.is_indoor == candidate.is_indoor &&
      existing.device_id == candidate.device_id &&
      existing.tag_list.uniq.sort == candidate.tag_list.uniq.sort

    same_recording ? existing : nil
  end

  # Prefer a time zone supplied by the client (indoor sessions send placeholder
  # coordinates, so their zone can't be derived from lat/lng). Fall back to
  # deriving it from the coordinates when absent or not a valid IANA identifier.
  def time_zone_for(data)
    provided = data[:time_zone].presence
    return provided if provided && valid_iana_time_zone?(provided)

    TimeZoneFinderWrapper.instance.time_zone_at(
      lat: data[:latitude],
      lng: data[:longitude],
    )
  end

  def valid_iana_time_zone?(time_zone)
    TZInfo::Timezone.get(time_zone)
    true
  rescue TZInfo::InvalidTimezoneIdentifier
    false
  end

  def build_local_start_and_end_time(session_data)
    session_data[:start_time_local] = DateTime.iso8601 session_data[:start_time]
    session_data[:end_time_local] = DateTime.iso8601 session_data[:end_time]
    session_data
  end

  def self.prepare_notes(note_data, photos)
    note_data
      .zip(photos)
      .map do |datum, photo|
        if photo.blank?
          datum
        else
          decoded = Base64.decode64(photo)
          content_type = Marcel::MimeType.for(StringIO.new(decoded))
          mime_type = Mime::Type.lookup(content_type)
          extension = mime_type.symbol.to_s
          filename = "photo_#{SecureRandom.hex(8)}.#{extension}"

          attached_photo =
            ActiveStorage::Blob.create_and_upload!(
              io: StringIO.new(decoded),
              filename: filename,
              content_type: content_type,
            )

          datum.merge(s3_photo: attached_photo)
        end
      end
  end

  def self.normalize_tags(tags)
    tags.to_s.split(/[\s,]/).reject(&:empty?).join(',')
  end
end
