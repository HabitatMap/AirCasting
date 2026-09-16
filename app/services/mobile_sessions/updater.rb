module MobileSessions
  # Partial update for a mobile session: title and tags — the metadata a user
  # edits after the recording exists. Only the provided fields change.
  #
  # Notes used to be here as a declarative-full array; they are their own
  # resource now (Notes::Creator / Updater / Destroyer), addressed by id rather
  # than by the client-assigned `number`.
  #
  # Streams and the device are deliberately out of scope. Streams are created by
  # `MobileSessions::Creator` and filled by the measurements endpoint; the new app
  # deletes whole sessions, never single streams. A `devices` row is shared by
  # every session recorded with that AirBeam, so it is managed by its own
  # endpoints, not from a per-session payload.
  #
  # `version` is what tells every other device to re-download the session, so it
  # is bumped only when something actually changed — a client that re-sends the
  # title it already has must not trigger a sync across the account.
  class Updater
    def call(session:, data:)
      ActiveRecord::Base.transaction do
        session.title = data[:title] if data.key?(:title)

        changed = false
        changed = assign_tags(session, data[:tag_list]) if data.key?(:tag_list)
        changed ||= session.changed?

        session.version = session.version.to_i + 1 if changed
        session.save!
      end

      Success.new(session: session)
    rescue ActiveRecord::RecordInvalid => e
      # The invalid data came from the client payload, so this is a validation
      # error, not an internal one.
      Failure.new(error_code: ErrorCodes::VALIDATION_ERROR, message: e.message)
    end

    private

    # Returns whether the tag *set* changed. Order and separator are not a change:
    # the serializer hands the client "a, b" and normalize_tags turns whatever
    # comes back into "a,b", so a round-trip must not look like an edit.
    def assign_tags(session, raw)
      tags = SessionBuilder.normalize_tags(raw).split(',')
      changed = tags.sort != session.tag_list.to_a.sort
      session.tag_list = tags
      changed
    end
  end
end
