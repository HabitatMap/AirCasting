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

    def call(stations:, source_name:)
      return if stations.empty?

      existing = repository.station_streams_by_key(source_name: source_name)

      changes =
        stations.filter_map do |station|
          current = existing[[station.measurement_type, station.external_ref]]
          next unless current
          next if unchanged?(station, current)

          log_move(source_name, station, current)
          {
            id: current.id,
            station_id: station.station_id,
            latitude: station.location.y,
            longitude: station.location.x,
            time_zone: station.time_zone,
            time_zone_changed: station.time_zone != current.time_zone,
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

    def unchanged?(station, current)
      current.station_id == station.station_id &&
        current.time_zone == station.time_zone &&
        Stations.same_point?(current.location, station.location.y, station.location.x)
    end

    def log_move(source_name, station, current)
      return if current.location.nil?

      distance =
        Stations.distance_m(
          current.location.y,
          current.location.x,
          station.location.y,
          station.location.x,
        )
      return if distance < LOGGED_MOVE_M

      logger.warn(
        "[#{source_name.to_s.upcase} stations] station_stream #{current.id} " \
          "(#{station.external_ref}, #{station.measurement_type}) moved " \
          "#{(distance / 1000).round(1)} km to #{station.location.y},#{station.location.x}",
      )
    end
  end
end
