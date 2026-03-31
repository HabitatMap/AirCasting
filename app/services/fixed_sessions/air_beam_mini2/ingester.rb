module FixedSessions
  module AirBeamMini2
    class Ingester
      def initialize(
        parser: BinaryParser.new,
        stream_daily_averages_recalculator: FixedStreaming::StreamDailyAveragesRecalculator.new,
        stream_hourly_averages_recalculator: FixedStreaming::StreamHourlyAveragesRecalculator.new
      )
        @parser = parser
        @stream_daily_averages_recalculator = stream_daily_averages_recalculator
        @stream_hourly_averages_recalculator = stream_hourly_averages_recalculator
      end

      def call(uuid:, binary:, user_id:, sync: false)
        measurements = parser.call(binary)
      rescue BinaryParser::ParseError => e
        return Failure.new(base: [e.message])
      else
        ingest(uuid: uuid, user_id: user_id, measurements: measurements, sync: sync)
      end

      private

      attr_reader :parser, :stream_daily_averages_recalculator, :stream_hourly_averages_recalculator

      def ingest(uuid:, user_id:, measurements:, sync:)
        session = FixedSession.find_by(uuid: uuid, user_id: user_id)
        return Failure.new(base: ['session not found']) unless session

        grouped = measurements.group_by { |m| m[:measurement_type_id] }

        ActiveRecord::Base.transaction do
          grouped.each do |type_id, type_measurements|
            stream = Stream.find_by(session_id: session.id, measurement_type_id: type_id)
            return Failure.new(base: ["unknown measurement_type_id: #{type_id}"]) unless stream

            records = build_records(type_measurements, session, stream)

            FixedMeasurement.import(
              records,
              on_duplicate_key_update: {
                conflict_target: %i[stream_id time_with_time_zone],
                columns: %i[value updated_at],
              },
            )

            recalculate_averages(stream, records) if sync
          end

          max_epoch = measurements.map { |m| m[:epoch] }.max
          max_time = Time.at(max_epoch).utc
          session.update!(end_time_local: max_time, last_measurement_at: Time.current)
        end

        Success.new('measurements ingested')
      rescue ActiveRecord::RecordInvalid => e
        Failure.new(base: [e.message])
      end

      def build_records(type_measurements, session, stream)
        type_measurements.map do |m|
          local = Time.at(m[:epoch]).in_time_zone(session.time_zone)
          time_naive = Time.parse(local.strftime('%Y-%m-%d %H:%M:%S'))

          FixedMeasurement.new(
            stream_id: stream.id,
            value: m[:value],
            time: time_naive,
            time_with_time_zone: local,
          )
        end
      end

      def recalculate_averages(stream, records)
        stream_daily_averages_recalculator.call(
          measurements: records,
          time_zone: stream.session.time_zone,
          stream_id: stream.id,
        )
        stream_hourly_averages_recalculator.call(
          measurements: records,
          stream_id: stream.id,
        )
      end
    end
  end
end
