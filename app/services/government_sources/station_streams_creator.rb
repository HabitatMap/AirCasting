module GovernmentSources
  class StationStreamsCreator
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(rows:)
      return if rows.empty?

      records = build_station_streams(rows)
      repository.insert_station_streams(records:)
    end

    private

    attr_reader :repository

    def build_station_streams(rows)
      current_time = Time.current
      rows.map { |row| build_station_stream(row, current_time) }
    end

    def build_station_stream(row, current_time)
      {
        external_ref: row.external_ref,
        location: row.location,
        time_zone: row.time_zone,
        title: row.title,
        url_token: row.url_token,
        source_id: row.source_id,
        stream_configuration_id: row.stream_configuration_id,
        station_id: row.station_id,
        created_at: current_time,
        updated_at: current_time,
      }
    end
  end
end
