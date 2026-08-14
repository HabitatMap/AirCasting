module Api
  module V3
    module MobileSessions
      class MeasurementsController < BaseController
        ErrorCodes = ::FixedSessions::BinaryProtocol::ErrorCodes
        around_action :with_server_time_header
        before_action :authenticate_user_from_token!
        before_action :authenticate_user!

        def create
          binary = request.body.read
          return head :ok if binary.empty?

          session = current_user.mobile_sessions.find_by(uuid: params[:mobile_session_uuid])

          unless session
            return render json: {
              error_code: ErrorCodes::SESSION_NOT_FOUND,
              message: 'Session not found',
            }, status: :not_found
          end

          result = ::MobileSessions::BinaryProtocol::Ingester.new.call(
            session: session,
            binary: binary,
          )

          if result.success?
            head :ok
          else
            render json: result.errors, status: :bad_request
          end
        end

        private

        def with_server_time_header
          yield
        ensure
          response.set_header('X-Server-Time', Time.now.to_i.to_s)
        end
      end
    end
  end
end
