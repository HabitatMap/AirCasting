module Api
  module V3
    class FixedStreamClustersController < BaseController
      def index
        averages =
          Timelapse::TimeSlicesTraverser.new.call(
            time_period: params[:time_period],
            clusters: params[:clusters]
          )

        render json: averages, status: :ok
      end

      def index2
        sessions_response = Api::ToActiveSessionsJson.new(form: form).call.value
        sessions = sessions_response['sessions']

        end_of_last_time_slice = Time.current.end_of_hour - 1.hour

        result = {}

        168.times do |hour|
          end_of_time_slice = end_of_last_time_slice - hour.hours
          begining_of_time_slice = end_of_time_slice.beginning_of_hour
          sessions.each do |session|
            stream_id = session['streams'].values.first['id']

            hourly_average =
              MeasurementsRepository.new.stream_average_from_period(
                stream_id: stream_id,
                start_date: begining_of_time_slice,
                end_date: end_of_time_slice
              )

            session_copy = session.deep_dup
            session_copy['last_measurement_value'] = hourly_average

            result[begining_of_time_slice + 1.hour] ||= []
            result[begining_of_time_slice + 1.hour] << session_copy
          end
        end

        render json: result, status: :ok
      end

      private

      def form
        q = ActiveSupport::JSON.decode(params.to_unsafe_hash[:q]).symbolize_keys
        q[:time_from] = Time.strptime(q[:time_from].to_s, '%s')
        q[:time_to] = Time.strptime(q[:time_to].to_s, '%s')

        Api::ParamsForm.new(
          params: q,
          schema: Api::FixedSessions::Schema,
          struct: Api::FixedSessions::Struct
        )
      end
    end
  end
end
