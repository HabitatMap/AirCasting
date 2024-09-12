module Api
  module Fixed
    module Active
      class SessionsController < BaseController
        respond_to :json

        def index
          GoogleAnalyticsWorker::RegisterEvent.async_call('Fixed active sessions#index')
          result = Api::ToActiveSessionsArray.new(form: form).call

          if result.success?
            render json: result.value, status: :ok
          else
            render json: result.errors, status: :bad_request
          end
        end

        def index2
          GoogleAnalyticsWorker::RegisterEvent.async_call('Fixed active sessions#index2')
          result = Api::ToActiveSessionsJson.new(form: form).call

          if result.success?
            # Gzip the response since we are sending a ton of data.
            request.env['HTTP_ACCEPT_ENCODING'] = 'gzip'
            render json: result.value, status: :ok
          else
            render json: result.errors, status: :bad_request
          end
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
end
