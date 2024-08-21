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
        sessions = FixedSession.active.filter_(data)

        end_of_last_time_slice = Time.current.end_of_hour - 1.hour
        begining_of_first_time_slice = end_of_last_time_slice.beginning_of_hour - 168.hours

        streams = Stream.where(session_id: sessions.pluck('sessions.id'))
        selected_sensor_streams = streams.select { |stream| Sensor.sensor_name(data[:sensor_name]).include? stream.sensor_name.downcase }

        result = {}

        sessions.each do |session|
          related_stream_id = selected_sensor_streams.find { |stream| stream.session_id == session.id }.id

          averages =
            MeasurementsRepository.new.stream_averages_from_period(
              stream_id: related_stream_id,
              start_date: begining_of_first_time_slice,
              end_date: end_of_last_time_slice
            )

          averages.each do |average|
            result[average[:time]] ||= []
            result[average[:time]] <<
              {
                "stream_id" => related_stream_id,
                "value" => average[:value],
                "latitude" => session.latitude,
                "longitude" => session.longitude,
              }
          end
        end

        render json: result, status: :ok
      end

      # def index2
      #   sessions_response = Api::ToActiveSessionsJson.new(form: form).call.value
      #   sessions = sessions_response['sessions']

      #   end_of_last_time_slice = Time.current.end_of_hour - 1.hour

      #   result = {}

      #   Rails.logger.info "Processing #{sessions.count} sessions"
      #   Rails.logger.flush
      #   puts "Processing #{sessions.count} sessions"

      #   168.times do |hour|
      #     end_of_time_slice = end_of_last_time_slice - hour.hours
      #     begining_of_time_slice = end_of_time_slice.beginning_of_hour
      #     sessions.each do |session|
      #       stream_id = session['streams'].values.first['id']

      #       hourly_average =
      #         MeasurementsRepository.new.stream_average_from_period(
      #           stream_id: stream_id,
      #           start_date: begining_of_time_slice,
      #           end_date: end_of_time_slice
      #         )

      #       session_copy = session.deep_dup
      #       session_copy['last_measurement_value'] = hourly_average

      #       result[begining_of_time_slice + 1.hour] ||= []
      #       result[begining_of_time_slice + 1.hour] << session_copy
      #     end
      #   end

      #   render json: result, status: :ok
      # end

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

      def data
        # dry-struct allows for missing key using `meta(omittable: true)`
        # This `form` has such a key named `is_indoor`. Unfortunately, when
        # `is_indoor` in `nil` if accessed with `form.to_h[:is_indoor]`, the
        # library raises. The solutions are:
        #   - Using `form.is_indoor`; this in not viable at the moment cause
        #     the code that is accessing the struct (Session.filter_) is used
        #     by other callers that are passing a vanilla Ruby hash.
        #   - Passing a vanilla Ruby hash with `form.to_h.to_h`
        form.to_h.to_h
      end
    end
  end
end
