module Api
  module V3
    class FixedStreamClustersController < BaseController
      def index


        result =
          ::Timelapse::ClustersCreator.new.call(
            params: data,
          )

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
