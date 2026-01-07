module Api
  module Fixed
    module Active
      class SessionsController < BaseController
        respond_to :json

        def index
          result = Api::ToActiveSessionsArray.new(contract: contract).call

          if result.success?
            render json: result.value, status: :ok
          else
            render json: result.errors, status: :bad_request
          end
        end

        def index2
          # splitting the logic for governemnt data, to improve performance
          sensor_name = contract.to_h[:sensor_name]
          if sensor_name == 'government-pm2.5' ||
               sensor_name == 'government-no2' ||
               sensor_name == 'government-ozone'
            result =
              ::FixedSessions::IndexInteractor.new(contract: contract).call
          else
            result = Api::ToActiveSessionsJson.new(contract: contract).call
          end

          if result.success?
            # Gzip the response since we are sending a ton of data.
            request.env['HTTP_ACCEPT_ENCODING'] = 'gzip'
            render json: result.value, status: :ok
          else
            render json: result.errors, status: :bad_request
          end
        end

        private

        def decoded_params
          q =
            ActiveSupport::JSON.decode(params.to_unsafe_hash[:q]).symbolize_keys
          q[:time_from] = Time.strptime(q[:time_from].to_s, '%s')
          q[:time_to] = Time.strptime(q[:time_to].to_s, '%s')

          q
        end

        def contract
          Api::FixedSessionsContract.new.call(decoded_params)
        end
      end
    end
  end
end
