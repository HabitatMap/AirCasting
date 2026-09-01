class SessionBuilder
  attr_reader :user

  def initialize(session_data, photos, user)
    @session_data = session_data
    @user = user
    @photos = photos
  end

  def build!
    data = @session_data.clone
    session = nil
    jobs = []

    data[:notes_attributes] =
      SessionBuilder.prepare_notes(data.delete(:notes), @photos)
    data[:tag_list] = SessionBuilder.normalize_tags(data[:tag_list])
    data[:user] = @user
    stream_data = data.delete(:streams)

    data = build_local_start_and_end_time(data)
    data[:time_zone] = time_zone_for(data)

    allowed = Session.attribute_names + %w[notes_attributes tag_list user]
    filtered = data.select { |k, _| allowed.include?(k.to_s) }

    # Serialised per uuid so two concurrent uploads of the same session cannot
    # both pass the uniqueness check and insert (see Session.with_uuid_lock).
    # Measurements are created after this block, so the lock is short-lived.
    Session.with_uuid_lock(data[:uuid]) do |contended|
      # We queued behind a concurrent upload of this same uuid and it won. Hand
      # back the row it created: the client gets the url_location its own request
      # would have returned, rather than an error it cannot act on, and no second
      # copy is written. This is the race that produced every duplicate in
      # production.
      #
      # Only when contended. Finding the uuid already taken without having waited
      # for anyone means a late retry or a reused uuid, which keeps the failure it
      # has always had.
      #
      # Both here and in FixedSessions::Creator the rule is the same: only hand
      # back a row this path could have produced itself, carrying what this request
      # actually uploaded.
      # order(:id): until the cleanup has run, 463 uuids still have more than one
      # row, and an unordered LIMIT 1 could hand back a copy the deduplication task
      # is about to delete — leaving the phone holding a url_location that stops
      # resolving. min(id) is the row that task keeps, so both agree on which copy
      # is canonical.
      # LOWER(): the uniqueness validation this bypasses is case-insensitive, so an
      # exact match would miss a row that is about to reject this upload anyway.
      # Scoped to the user first, so the index does the work before LOWER runs.
      existing =
        if contended
          @user.sessions
               .where('LOWER(sessions.uuid) = ?', data[:uuid].to_s.downcase)
               .where(type: data[:type])
               .order(:id)
               .first
        end

      # A session_token means the row came from the v3 fixed create and is bound
      # to one AirBeam, which was flashed with that token over BLE. Returning it
      # here would give a legacy client a location for another device's session,
      # and both devices would then report into the same streams — silent data
      # mixing, worse than the 400 this returns instead. Nothing on this path ever
      # sets a session_token, so for mobile uploads the check never fires.
      existing = nil if existing && existing.session_token.present?

      # Contention proves two requests overlapped on this uuid; it does not prove
      # they carry the same recording. A client that reused a uuid for a different
      # session would otherwise be told 200 and handed a location for the earlier
      # one, silently discarding what it just uploaded.
      #
      # The two ways this can be wrong are not equally bad, so it errs wide:
      # calling two identical uploads different costs a 400, which is what this
      # path returned before the short-circuit existed; calling two different
      # uploads identical discards one silently. Every field that cannot legitimately
      # differ between two uploads of one recording is therefore included, since
      # adding one can only ever turn a silent discard into a 400.
      #
      # Narrower than MobileSessionFingerprint on purpose, though it asks the same
      # question: that one compares stream shape and measurement counts, which are
      # unreadable here. The winner commits its session and streams while Sidekiq
      # is still inserting measurements, so mid-race it legitimately reads zero.
      # Everything compared below is written in that same transaction and is
      # readable the moment the loser takes the lock.
      #
      # Comparing against a non-persisted Session runs the same setters as the
      # create below, so the local-time conversion is applied to both sides rather
      # than reimplemented here.
      if existing
        # notes_attributes is dropped: nothing below reads it, and building it
        # would construct a Note per note and register an ActiveStorage attachment
        # change for each — inside the lock. Those changes call
        # blob.identify_without_saving, a no-op for blobs create_and_upload! has
        # already identified, but a download from the storage service for one that
        # is not. No network round trip belongs under this lock.
        candidate = Session.new(filtered.except(:notes_attributes))

        # uniq on both sides: normalize_tags turns "beach beach" into "beach,beach"
        # while the stored row reads back one tagging. TagList dedups on assignment
        # in the gem version in use, so today both sides already agree — this keeps
        # the comparison from depending on that.
        same_recording =
          existing.title == candidate.title &&
          existing.start_time_local == candidate.start_time_local &&
          existing.end_time_local == candidate.end_time_local &&
          existing.time_zone == candidate.time_zone &&
          existing.contribute == candidate.contribute &&
          existing.is_indoor == candidate.is_indoor &&
          existing.device_id == candidate.device_id &&
          existing.tag_list.uniq.sort == candidate.tag_list.uniq.sort

        existing = nil unless same_recording
      end

      if existing
        session = existing
      else
        session = Session.create!(filtered)

        stream_data.values.each do |a_stream|
          measurements = a_stream.delete(:measurements)
          next unless measurements.any?
          a_stream.merge!(session: session)
          stream = Stream.build_with_threshold_set!(a_stream)
          jobs.push([stream, measurements])
        end
      end
    end

    jobs.each do |(stream, measurements)|
      MeasurementsCreator.new.call(stream, measurements)
    end

    session
  rescue ActiveRecord::RecordInvalid => invalid
    Rails.logger.warn("[SessionBuilder] data: #{data}")
    Rails.logger.warn(invalid.record.errors.full_messages)
    nil
  rescue ActiveRecord::RecordNotUnique => e
    # Nothing on this path raises this today: tags.name is not unique, taggings are
    # keyed on the new session's id and attachment uniqueness on the new Note's,
    # blobs are created before the lock, and sessions.session_token — which is unique — is
    # only set when the client sends one, which no legacy client does. It becomes
    # reachable when sessions.uuid gets its unique index, for an insert that got
    # past the uniqueness validation's SELECT. Answered like an invalid session
    # (the controller renders 400) rather than surfacing as a 500.
    #
    # FixedSessions::Creator's identical rescue *is* live, through a different
    # constraint — see the note there.
    Rails.logger.warn("[SessionBuilder] uuid conflict for #{data[:uuid]}: #{e.message}")
    nil
  rescue ActiveRecord::LockWaitTimeout
    # Another upload of this uuid is still in flight. Same outcome as an invalid
    # session: the controller answers 400 and the app retries on its next sync.
    Rails.logger.warn("[SessionBuilder] uuid lock timeout for #{data[:uuid]}")
    nil
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
