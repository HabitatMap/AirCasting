module Api
  module V3
    module FixedSessions
      class MeasurementsController < BaseController
        ErrorCodes = ::FixedSessions::BinaryProtocol::ErrorCodes
        around_action :with_server_time_header
        before_action :authenticate_user_from_token!
        before_action :authenticate_session_from_token!
        before_action :require_authentication!

        def create
          binary = request.body.read
          return head :ok if binary.empty?

          session = @authenticated_session || find_session_for_user

          unless session
            monitor.report_session_not_found(
              session_uuid: params[:fixed_session_uuid],
              auth_method: bearer_token.present? ? 'bearer' : 'basic',
            )
            return render json: { error_code: ErrorCodes::SESSION_NOT_FOUND, message: 'Session not found' }, status: :not_found
          end

          result = ::FixedSessions::BinaryProtocol::Ingester.new(monitor: monitor).call(
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

        def authenticate_session_from_token!
          token = bearer_token
          return unless token

          @authenticated_session = FixedSession.find_by(
            uuid: params[:fixed_session_uuid],
            session_token: token,
          )
        end

        def require_authentication!
          return if current_user.present? || @authenticated_session.present?

          monitor.report_auth_failure(session_uuid: params[:fixed_session_uuid])
          render json: { error_code: ErrorCodes::UNAUTHORIZED, message: 'Unauthorized' }, status: :unauthorized
        end

        def with_server_time_header
          yield
        ensure
          response.set_header('X-Server-Time', Time.now.to_i.to_s)
        end

        def bearer_token
          auth = request.authorization
          @bearer_token ||= auth.sub('Bearer ', '') if auth&.start_with?('Bearer ')
        end

        def find_session_for_user
          FixedSessionsRepository.new.find_by(
            uuid: params[:fixed_session_uuid],
            user_id: current_user.id,
          )
        end

        def monitor
          @monitor ||= ::FixedSessions::BinaryProtocol::Monitor.new
        end
      end
    end
  end
end
