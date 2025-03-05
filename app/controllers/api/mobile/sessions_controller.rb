module Api
  module Mobile
    class SessionsController < BaseController
      respond_to :json

      def index
        q = ActiveSupport::JSON.decode(params.to_unsafe_hash[:q]).symbolize_keys
        q[:time_from] = Time.strptime(q[:time_from].to_s, '%s')
        q[:time_to] = Time.strptime(q[:time_to].to_s, '%s')

        contract = Api::MobileSessionsContract.new.call(q)
        result = Api::ToMobileSessionsArray.new(contract: contract).call

        if result.success?
          render json: result.value, status: :ok
        else
          render json: result.errors, status: :bad_request
        end
      end

      def show2
        contract =
          Api::SessionBySensorNameContract.new.call(params.to_unsafe_hash)

        if contract.failure?
          render json: contract.errors.to_h, status: :bad_request
        else
          stream = stream(contract.to_h[:id], contract.to_h[:sensor_name])
          hash = Api::ToSessionHash2.new(stream: stream).call
          render json: hash, status: :ok
        end
      end

      private

      def stream(session_id, sensor_name)
        Stream
          .includes(:threshold_set)
          .joins(:session)
          .find_by!(sensor_name: sensor_name, sessions: { id: session_id })
      end
    end
  end
end
