module Api
  module V3
    module FixedPolling
      class SessionsController < BaseController
        before_action :authenticate_user_from_token!, only: :create
        before_action :authenticate_user!, only: :create

        def show
          result =
            ::FixedPolling::Interactor.new.call(params: params.to_unsafe_hash)

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
