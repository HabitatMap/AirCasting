module GovernmentSources
  # Brings existing streams in line with the site list: their station, point and
  # time zone. Nothing else is touched -- in particular not `url_token`, which
  # the enricher regenerates for every row it sees.
  #
  # Only rows that actually change are written, so `updated_at` (which the
  # daily-average calculator selects on) moves only for real changes.
  class StationStreamsUpdater
    LOGGED_MOVE_M = 1_000

    def initialize(
      repository: Repository.new,
      daily_averages_rebuilder: RebuildStationStreamDailyAveragesWorker,
      logger: Rails.logger
    )
      @repository = repository
      @daily_averages_rebuilder = daily_averages_rebuilder
      @logger = logger
    end

    def call(rows:, source_name:)
      return if rows.empty?

      existing = repository.station_streams_by_key(source_name: source_name)

      changes =
        rows.filter_map do |row|
          current = existing[[row.measurement_type, row.external_ref]]
          next unless current
          next if unchanged?(row, current)

          log_move(source_name, row, current)
          {
            id: current.id,
            station_id: row.station_id,
            latitude: row.location.y,
            longitude: row.location.x,
            time_zone: row.time_zone,
            time_zone_changed: row.time_zone != current.time_zone,
          }
        end

      repository.update_station_streams(changes: changes)

      # Daily averages are stored per local day, so a new time zone moves
      # every day boundary in the stream's history.
      rezoned = changes.select { |c| c[:time_zone_changed] }.map { |c| c[:id] }
      daily_averages_rebuilder.perform_async(rezoned) if rezoned.any?
    end

    private

    attr_reader :repository, :daily_averages_rebuilder, :logger

    def unchanged?(row, current)
      current.station_id == row.station_id &&
        current.time_zone == row.time_zone &&
        GovernmentSources.same_point?(current.location, row.location.y, row.location.x)
    end

    def log_move(source_name, row, current)
      return if current.location.nil?

      distance =
        GovernmentSources.distance_m(
          current.location.y,
          current.location.x,
          row.location.y,
          row.location.x,
        )
      return if distance < LOGGED_MOVE_M

      logger.warn(
        "[#{source_name.to_s.upcase} stations] station_stream #{current.id} " \
          "(#{row.external_ref}, #{row.measurement_type}) moved " \
          "#{(distance / 1000).round(1)} km to #{row.location.y},#{row.location.x}",
      )
    end
  end
end
