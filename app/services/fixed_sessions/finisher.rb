module FixedSessions
  # Decommissions a fixed session. `finished_at` outranks the silence signal
  # `FixedSession#is_active` reads: a finished session is dormant however recently
  # it reported. Guarded on `finished_at IS NULL`, so a retry keeps the first
  # timestamp and bumps `version` once. Cannot fail — one UPDATE, and "matched
  # nothing" means already finished.
  class Finisher
    def call(session:)
      now = Time.current

      FixedSession
        .where(id: session.id, finished_at: nil)
        .update_all(
          ['finished_at = ?, version = version + 1, updated_at = ?', now, now],
        )

      Success.new(session: session)
    end
  end
end
