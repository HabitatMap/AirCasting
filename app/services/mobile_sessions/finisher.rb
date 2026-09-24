module MobileSessions
  # Declares a mobile session over — a phone goes quiet for a tunnel and for a
  # finished ride alike, so the end is declared, never inferred. Guarded on
  # `finished_at IS NULL`, so a retry after a lost response keeps the first
  # timestamp and bumps `version` once. `version` moves because it is what tells
  # the user's other devices to re-download. Cannot fail — one UPDATE, and
  # "matched nothing" means already finished.
  class Finisher
    def call(session:)
      now = Time.current

      MobileSession
        .where(id: session.id, finished_at: nil)
        .update_all(
          ['finished_at = ?, version = version + 1, updated_at = ?', now, now],
        )

      Success.new(session: session)
    end
  end
end
