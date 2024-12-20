module StreamHourlyAverages
  module AirNow
    class Repository
      def measurements_by_ids(ids:)
        Measurement.where(id: ids)
      end

      def streams_by_ids(ids:)
        Stream.where(id: ids)
      end

      def import_stream_hourly_averages(stream_hourly_averages:)
        StreamHourlyAverage.import(stream_hourly_averages)
      end

      def latest_stream_hourly_averages(stream_ids:)
        StreamHourlyAverage
          .where(stream_id: stream_ids)
          .select('DISTINCT ON (stream_id) id, stream_id, date_time')
          .order('stream_id, date_time DESC')
      end

      def update_stream(stream:, last_hourly_average_id:)
        stream.update!(last_hourly_average_id: last_hourly_average_id)
      end
    end
  end
end
