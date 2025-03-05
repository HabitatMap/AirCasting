module StreamHourlyAverages
  module AirNow
    class Updater
      def initialize(repository: Repository.new)
        @repository = repository
      end

      def call(measurement_ids:)
        ApplicationRecord.transaction do
          measurements, streams =
            fetch_measurements_and_streams(measurement_ids)
          create_stream_hourly_averages(measurements)

          update_streams_with_latest_stream_hourly_averages(streams)
        end
      end

      private

      attr_reader :repository

      def fetch_measurements_and_streams(measurement_ids)
        measurements = repository.measurements_by_ids(ids: measurement_ids)
        streams = repository.streams_by_ids(ids: measurements.pluck(:stream_id))

        [measurements, streams]
      end

      def create_stream_hourly_averages(measurements)
        stream_hourly_averages =
          measurements.map do |measurement|
            StreamHourlyAverage.new(
              stream_id: measurement.stream_id,
              date_time: measurement.time_with_time_zone,
              value: measurement.value,
            )
          end

        repository.import_stream_hourly_averages(
          stream_hourly_averages: stream_hourly_averages,
        )
      end

      def update_streams_with_latest_stream_hourly_averages(streams)
        latest_stream_hourly_averages =
          fetch_latest_stream_hourly_averages(streams)

        streams.each do |stream|
          latest_id = latest_stream_hourly_averages[stream.id]

          if latest_id != stream.last_hourly_average_id
            repository.update_stream(
              stream: stream,
              last_hourly_average_id: latest_id,
            )
          end
        end
      end

      def fetch_latest_stream_hourly_averages(streams)
        stream_hourly_averages =
          repository.latest_stream_hourly_averages(
            stream_ids: streams.pluck(:id),
          )

        stream_hourly_averages.index_by(&:stream_id).transform_values(&:id)
      end
    end
  end
end
