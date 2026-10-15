module Explore
  # Active government stations in the bounds, one Item per station with its
  # selected streams.
  #
  # Only streams grouped into a station are read: the INNER JOIN on stations
  # leaves out EEA, which has none yet, and shows it once it does.
  class GovItemsQuery
    SOURCE = 'government'.freeze

    COLUMNS = [
      'stations.uuid',
      'stations.title',
      'sources.name',
      Arel.sql('ST_Y(stations.location)'),
      Arel.sql('ST_X(stations.location)'),
      'stream_configurations.measurement_type',
      'stream_configurations.unit_symbol',
      'station_streams.last_measured_at',
      'station_measurements.value',
    ].freeze

    def call(bounds:, parameters:, title: nil)
      return [] unless parameters.government?

      rows = scope(bounds, parameters, title).pluck(*COLUMNS)

      rows
        .group_by(&:first)
        .map do |uuid, station_rows|
          _, station_title, provider, latitude, longitude = station_rows.first

          Item.with_streams(
            source: SOURCE,
            uuid: uuid,
            title: station_title,
            provider: provider,
            latitude: latitude,
            longitude: longitude,
            streams: station_rows.map { |row| stream(row, parameters) },
          )
        end
    end

    private

    def scope(bounds, parameters, title)
      query =
        StationStream
          .joins(:station, :stream_configuration)
          .joins('JOIN sources ON sources.id = stations.source_id')
          .joins(
            'JOIN station_measurements
               ON station_measurements.station_stream_id = station_streams.id
              AND station_measurements.measured_at = station_streams.last_measured_at',
          )
          .merge(Station.shown)
          .where(
            stream_configurations: {
              canonical: true,
              measurement_type: parameters.government_measurement_types,
            },
          )
          .where(
            'station_streams.last_measured_at > ?',
            StationStream::ACTIVE_FOR.ago,
          )
          .where(bounds.envelope_condition('stations.location'))

      return query if title.blank?

      query.where(
        'stations.title ILIKE ?',
        "%#{ActiveRecord::Base.sanitize_sql_like(title)}%",
      )
    end

    def stream(row, parameters)
      _, _, _, _, _, measurement_type, unit_symbol, last_measured_at, value = row

      ItemStream.new(
        sensor_name: "Government-#{measurement_type}",
        parameter: parameters.parameter_for_government(measurement_type),
        unit_symbol: unit_symbol,
        last_value: value,
        last_measured_at: last_measured_at,
      )
    end
  end
end
