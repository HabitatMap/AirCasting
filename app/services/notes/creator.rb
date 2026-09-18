module Notes
  # Adds one note to a session. `number` is allocated here rather than taken
  # from the client: it is no longer the note's identity (the `id` is), and the
  # two apps allocated it inconsistently. Kept 0-based to match what they did
  # and what is already in the database.
  #
  # Bumping the session `version` is what tells the user's other devices to
  # re-download, so it happens on every note write.
  class Creator
    def call(session:, data:)
      note = nil

      ActiveRecord::Base.transaction do
        note = session.notes.new(data.except(:photo).merge(number: next_number(session)))
        note.save!
        PhotoAttacher.new.call(note, data)

        session.version = session.version.to_i + 1
        session.save!
      end

      Success.new(note: note)
    rescue ActiveRecord::RecordInvalid => e
      Failure.new(error_code: ::MobileSessions::ErrorCodes::VALIDATION_ERROR, message: e.message)
    end

    private

    # Holes are normal — nothing renumbers after a delete, here or in either
    # app — so this carries on from the highest number rather than filling gaps.
    # Two concurrent creates can collide on a number; nothing depends on it
    # being unique now that identity is the `id`.
    #
    # nil covers both "no notes" and "only legacy notes, none of them numbered",
    # and both start at 0.
    def next_number(session)
      highest = session.notes.maximum(:number)
      highest ? highest + 1 : 0
    end
  end
end
