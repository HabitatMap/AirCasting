class SessionBuilder
  # How long to wait for a rival's in-flight insert of the same uuid before giving
  # up and answering 400.
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

    # The unique index on LOWER(uuid) is what makes a duplicate impossible; this
    # decides what the losing request is told. Insert first and let the constraint
    # refuse us, rather than asking whether the uuid is free — the answer to that
    # question is stale the moment it is given.
    #
    # A late retry never reaches the constraint: the uniqueness validation catches
    # it and returns the 400 this path has always returned. Only a request whose
    # rival had not yet committed at validation time gets here.
    # `jobs` is bound to whatever the transaction returns, so a rolled-back attempt
    # cannot leave streams queued for measurements that no longer have a stream to
    # belong to.
    session, jobs =
      begin
        # requires_new so the recovery below survives a caller that wraps this in a
        # transaction of its own: without a SAVEPOINT the constraint violation
        # poisons the outer transaction and reusable_session's SELECT raises
        # PG::InFailedSqlTransaction instead of returning the winner's row.
        ActiveRecord::Base.transaction(requires_new: true) do
          # An INSERT that meets a rival's *uncommitted* index entry waits for that
          # transaction to finish, and nothing here or in the server config bounds
          # that wait. This is the bound the advisory lock used to provide: past it
          # the client gets the 400 it would have got before, rather than a puma
          # thread parked on someone else's slow upload.
          # SET LOCAL is scoped to the transaction, not the savepoint: a released
          # savepoint leaves it in force for the rest of a caller's transaction,
          # which would hand them a 3s lock_timeout they never asked for. Only the
          # outermost transaction is ours to bound — open_transactions is 1 then,
          # and 2+ when a caller wraps us (transaction_open? is true either way,
          # since it sees our own).
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
        # when the conflict was some other constraint, or the row is not one this
        # path could have produced — the outer rescue then answers 400, as before.
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
    # A rival's insert of this uuid is still in flight after LOCK_TIMEOUT. Same
    # answer as an invalid session: 400, and the app retries on its next sync.
    Rails.logger.warn("[SessionBuilder] uuid insert timed out for #{data[:uuid]}")
    nil
  rescue ActiveRecord::RecordNotUnique => e
    # Reached only when the conflict was not a reusable session of ours — another
    # constraint, another user's row, or one carrying a different recording. Same
    # answer as an invalid session: the controller renders 400.
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
    # one AirBeam, flashed with that token over BLE. Handing it to a legacy client
    # would put two devices on one session, reporting into the same streams —
    # silent data mixing, worse than the 400 returned instead. Nothing on this path
    # sets a session_token, so for mobile uploads this never fires.
    return nil if existing.session_token.present?

    # Losing the race proves two requests overlapped on this uuid; it does not
    # prove they carry the same recording. A client reusing a uuid for a different
    # session would otherwise be told 200 and handed a location for the earlier
    # one, silently discarding what it just uploaded.
    #
    # The two ways this can be wrong are not equally bad, so it errs wide: calling
    # two identical uploads different costs a 400, which is what this path returned
    # before; calling two different uploads identical discards one silently. Every
    # field that cannot legitimately differ between two uploads of one recording is
    # therefore compared, since adding one can only turn a silent discard into a 400.
    #
    # Streams and measurement counts are deliberately excluded: the winner commits
    # its session and streams while Sidekiq is still inserting measurements, so it
    # legitimately reads zero here. Everything below is written in that same
    # transaction.
    #
    # notes_attributes is dropped from the comparison object: nothing here reads it,
    # and building it would construct a Note per note and register an ActiveStorage
    # attachment change for each — and those call blob.identify_without_saving,
    # which downloads from the storage service for any blob not already identified.
    candidate = Session.new(filtered.except(:notes_attributes))

    # uniq on both sides: normalize_tags turns "beach beach" into "beach,beach"
    # while the stored row reads back one tagging. TagList dedups on assignment in
    # the gem version in use, so both sides agree today — this keeps the comparison
    # from depending on that.
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
