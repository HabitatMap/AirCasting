module Api
  module V3
    class FixedSessionsController < BaseController
      before_action :authenticate_user_from_token!
      before_action :authenticate_user!

      def create
        result =
          AirBeamMini2::FixedSessions::Creator.new.call(
            data: params.to_unsafe_h.deep_symbolize_keys,
            user: current_user,
          )

        if result.success?
          session = result.value[:session]
          render json: {
            location: short_session_url(session, host: A9n.host_),
            streams: result.value[:streams],
          }, status: :created
        else
          render json: result.errors, status: :bad_request
        end
      end
    end
  end
end
