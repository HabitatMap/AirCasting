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

          form =
            Api::ParamsForm.new(
              params: q,
              schema: Api::FixedSessions::Schema,
              struct: Api::FixedSessions::Struct,
            )

          result = Api::ToDormantSessionsArray.new(form: form).call

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
