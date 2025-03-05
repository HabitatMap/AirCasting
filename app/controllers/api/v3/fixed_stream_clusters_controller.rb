module Api
  module V3
    class FixedStreamClustersController < BaseController
      def index
        result = ::Timelapse::ClustersCreator.new.call(contract: contract)

        if result.success?
          render json: result.value, status: :ok
        else
          render json: result.errors, status: :bad_request
        end
      end

      private

      def contract
        q = ActiveSupport::JSON.decode(params.to_unsafe_hash[:q]).symbolize_keys
        q[:time_from] = Time.strptime(q[:time_from].to_s, '%s')
        q[:time_to] = Time.strptime(q[:time_to].to_s, '%s')

        Api::FixedSessionsContract.new.call(q)
      end
    end
  end
end
