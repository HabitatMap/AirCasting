require 'csv'

# Appends one row per hour to log/dual_write_check.csv, comparing ingested
# measurement counts and freshness between the legacy path (fixed_measurements
# via stream_id) and the new path (station_measurements) for both EPA and EEA.
#
# Scheduled hourly in config/sidekiq.yml.
#
# Window: (now-2h, now-1h] by created_at — the closed past-hour window avoids
# a race condition where measurements being written mid-check would inflate
# counts inconsistently between the two paths.
class DualWriteCheckWorker
  include Sidekiq::Worker

  sidekiq_options queue: :slow, retry: 0

  LOG_PATH = Rails.root.join('log', 'dual_write_check.csv').freeze

  HEADERS = [
    'Window',
    'EPA legacy ingested no',
    'EPA new ingested no',
    'EPA last legacy measurement',
    'EPA last new measurement',
    'EEA legacy ingested no',
    'EEA new ingested no',
    'EEA last legacy measurement',
    'EEA last new measurement',
  ].freeze

  def perform
    window_end   = 1.hour.ago.beginning_of_hour
    window_start = window_end - 1.hour

    row = [
      "#{window_start.iso8601}..#{window_end.iso8601}",
      *epa_stats(window_start, window_end),
      *eea_stats(window_start, window_end),
    ]

    write_csv(row)

    Rails.logger.info(
      "[DualWriteCheckWorker] window=#{window_start.iso8601}..#{window_end.iso8601} " \
      "epa_legacy=#{row[1]} epa_new=#{row[2]} " \
      "eea_legacy=#{row[5]} eea_new=#{row[6]}"
    )
  end

  private

  def epa_stats(window_start, window_end)
    legacy_count = FixedMeasurement
      .joins(stream: { session: :user })
      .where(users: { username: 'US EPA AirNow' })
      .where('fixed_measurements.created_at > ? AND fixed_measurements.created_at <= ?', window_start, window_end)
      .count

    legacy_last = FixedMeasurement
      .joins(stream: { session: :user })
      .where(users: { username: 'US EPA AirNow' })
      .maximum(:time_with_time_zone)

    new_count = StationMeasurement
      .joins(station_stream: :source)
      .where(sources: { name: 'EPA' })
      .where('station_measurements.created_at > ? AND station_measurements.created_at <= ?', window_start, window_end)
      .count

    new_last = StationMeasurement
      .joins(station_stream: :source)
      .where(sources: { name: 'EPA' })
      .maximum(:measured_at)

    [legacy_count, new_count, legacy_last&.iso8601, new_last&.iso8601]
  end

  def eea_stats(window_start, window_end)
    legacy_count = FixedMeasurement
      .joins(stream: { session: :user })
      .where(users: { username: 'EEA' })
      .where('fixed_measurements.created_at > ? AND fixed_measurements.created_at <= ?', window_start, window_end)
      .count

    legacy_last = FixedMeasurement
      .joins(stream: { session: :user })
      .where(users: { username: 'EEA' })
      .maximum(:time_with_time_zone)

    new_count = StationMeasurement
      .joins(station_stream: :source)
      .where(sources: { name: 'EEA' })
      .where('station_measurements.created_at > ? AND station_measurements.created_at <= ?', window_start, window_end)
      .count

    new_last = StationMeasurement
      .joins(station_stream: :source)
      .where(sources: { name: 'EEA' })
      .maximum(:measured_at)

    [legacy_count, new_count, legacy_last&.iso8601, new_last&.iso8601]
  end

  def write_csv(row)
    write_headers = !LOG_PATH.exist?
    CSV.open(LOG_PATH, 'a') do |csv|
      csv << HEADERS if write_headers
      csv << row
    end
  end
end
