module Notes
  # Removes one note. The numbering is left with a hole: nothing in this
  # codebase assumes note numbers are contiguous, neither app renumbers after
  # its own local delete, and `number` is still the key the legacy v1 sync path
  # matches on (Session#sync, app/models/session.rb:271) — renumbering would
  # rewrite it underneath a client that had not synced yet.
  class Destroyer
    def call(session:, note:)
      ActiveRecord::Base.transaction do
        # destroy, not delete: `has_one_attached` purges the blob and the S3
        # object through the dependent callback, which delete_all would skip.
        # That callback is `after_destroy_commit`, so a rollback here leaves the
        # photo alone rather than deleting it out from under a surviving note.
        note.destroy!

        session.version = session.version.to_i + 1
        session.save!
      end

      Success.new(note: note)
    rescue ActiveRecord::RecordNotDestroyed, ActiveRecord::RecordInvalid => e
      Failure.new(error_code: ::MobileSessions::ErrorCodes::VALIDATION_ERROR, message: e.message)
    end
  end
end
