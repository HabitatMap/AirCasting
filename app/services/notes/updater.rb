module Notes
  # Partial edit of one note: `text`, `photo`, or both. Anything absent is left
  # alone. The session `version` moves only when something actually changed, so
  # a client re-sending the text it already has does not trigger a sync across
  # the account.
  class Updater
    def call(session:, note:, data:)
      ActiveRecord::Base.transaction do
        note.text = data[:text] if data.key?(:text)
        changed = note.changed?
        note.save!

        changed = PhotoAttacher.new.call(note, data) || changed

        if changed
          session.version = session.version.to_i + 1
          session.save!
        end
      end

      Success.new(note: note)
    rescue ActiveRecord::RecordInvalid => e
      Failure.new(error_code: ::MobileSessions::ErrorCodes::VALIDATION_ERROR, message: e.message)
    end
  end
end
