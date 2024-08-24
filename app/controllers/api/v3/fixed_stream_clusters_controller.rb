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
        start_time = Time.current
        sessions = FixedSession.active.filter_(data)

        zoom_level = data[:zoom_level] || 5

        end_of_last_time_slice = Time.current.end_of_hour - 1.hour
        begining_of_first_time_slice = end_of_last_time_slice.beginning_of_hour - 168.hours

        result = Timelapse::ClustersCreator.new.call(sessions: sessions, begining_of_first_time_slice: begining_of_first_time_slice, end_of_last_time_slice: end_of_last_time_slice, sensor_name: data[:sensor_name])

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
