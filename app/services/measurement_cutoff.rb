# What a finished session does with measurements that keep arriving. Client
# decision, 2026-09-24: anything recorded *before* the finish is stored — a
# phone that was offline for a week syncing its backlog is the normal case —
# and anything recorded *after* is silently dropped.
#
# Dropped frames still answer 200. AirBeams and the Mini trim their buffer on a
# 2xx and on nothing else, so a 4xx would leave a decommissioned monitor
# re-POSTing the same batch for the life of the device. The drop is therefore
# invisible to the client, and the log line below is its only trace.
class MeasurementCutoff
  # The caller supplies `instant_of` because the two ingest shapes carry time
  # differently — binary frames carry a UTC epoch, the legacy JSON carries a
  # local wall clock — while `finished_at` is a real instant. Converting at the
  # call site keeps the comparison honest instead of comparing a wall clock to
  # an instant.
  def call(session:, measurements:, &instant_of)
    return measurements unless session.finished_at

    kept = measurements.select { |m| instant_of.call(m) <= session.finished_at }
    return kept if kept.size == measurements.size

    Rails.logger.info(
      "[MeasurementCutoff] session=#{session.id} " \
      "finished_at=#{session.finished_at.utc.iso8601} " \
      "dropped=#{measurements.size - kept.size} kept=#{kept.size}",
    )

    kept
  end
end
