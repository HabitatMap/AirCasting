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

        points = []

        sessions.each do |session|
          related_stream_id = selected_sensor_streams.find { |stream| stream.session_id == session.id }.id

          points << {
            latitude: session.latitude,
            longitude: session.longitude,
            stream_id: related_stream_id
          }
        end

        clusters = ClusterPoints.new(points, 40).perform_clustering

        result = {}

        clusters.each do |cluster|
          averages =
          MeasurementsRepository.new.streams_averages_from_period(
            stream_ids: cluster.points.map { |point| point[:stream_id] },
            start_date: begining_of_first_time_slice,
            end_date: end_of_last_time_slice
          )

          averages.each do |average|
            result[average[:time]] ||= []
            result[average[:time]] <<
              {
                "value" => average[:value],
                "latitude" => session.latitude,
                "longitude" => session.longitude,
                "sessions" => cluster.points.count
              }
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
