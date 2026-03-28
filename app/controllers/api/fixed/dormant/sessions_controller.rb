module Api
  module Fixed
    module Dormant
      class SessionsController < BaseController
        respond_to :json

        def index
          q =
            ActiveSupport::JSON.decode(params.to_unsafe_hash[:q]).symbolize_keys
          q[:time_from] = Time.strptime(q[:time_from].to_s, '%s')
          q[:time_to] = Time.strptime(q[:time_to].to_s, '%s')

          contract = Api::FixedSessionsContract.new.call(q)

          sensor_name = contract.to_h[:sensor_name]
          if sensor_name == 'government-pm2.5' ||
               sensor_name == 'government-no2' ||
               sensor_name == 'government-ozone'
            result =
              ::StationStreams::DormantIndexInteractor.new(contract: contract).call
          else
            result = Api::ToDormantSessionsArray.new(contract: contract).call
          end

          if result.success?
            render json: result.value, status: :ok
          else
            render json: result.errors, status: :bad_request
          end
        end
      end
    end
  end
end
