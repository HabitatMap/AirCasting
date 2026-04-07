module Api
  module V3
    class FixedSessionsController < BaseController
      ErrorCodes = ::FixedSessions::AirBeamMini2::ErrorCodes
      before_action :authenticate_user_from_token!
      before_action :authenticate_user!

      def create
        contract = Api::CreateFixedSessionContract.new.call(
          params.to_unsafe_h.deep_symbolize_keys,
        )
        if contract.failure?
          return render json: {
            error_code: ErrorCodes::VALIDATION_ERROR,
            message: 'Request body is invalid',
            fields: contract.errors.to_h,
          }, status: :bad_request
        end

        result =
          ::FixedSessions::Creator.new.call(
            data: contract.to_h,
            user: current_user,
          )

        if result.success?
          session = result.value[:session]
          render json: {
            location: short_session_url(session, host: A9n.host_),
            session_token: result.value[:session_token],
            streams: result.value[:streams],
          }, status: :created
        else
          render json: result.errors, status: :bad_request
        end
      end
    end
  end
end
