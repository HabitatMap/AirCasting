module Api
  module V3
    module FixedSessions
      class MeasurementsController < BaseController
        ErrorCodes = ::FixedSessions::BinaryProtocol::ErrorCodes
        Parser = ::FixedSessions::BinaryProtocol::Parser
        around_action :with_server_time_header
        before_action :authenticate_session_from_token
        before_action :authenticate_user_from_bearer_token
        before_action :require_authentication!

        def create
          return payload_too_large if declared_size_over_limit?

          binary = request.body.read
          return head :ok if binary.empty?

          session = @authenticated_session || find_session_for_user

          unless session
            monitor.report_session_not_found(
              session_uuid: params[:fixed_session_uuid],
              auth_method: 'user_token',
            )
            return render_error(ErrorCodes::SESSION_NOT_FOUND, 'Session not found')
          end

          result = ::FixedSessions::BinaryProtocol::Ingester.new(monitor: monitor).call(
            session: session,
            binary: binary,
          )

          if result.success?
            head :ok
          else
            render_failure(result)
          end
        end

        private

        # Answered before the body is read, so an oversized upload costs the headers
        # and nothing more. A chunked request carries no Content-Length and is
        # caught by the parser instead.
        def declared_size_over_limit?
          request.content_length.to_i > Parser::MAX_PAYLOAD_SIZE
        end

        def payload_too_large
          render_error(
            Parser::ErrorCodes::PAYLOAD_TOO_LARGE,
            "Payload exceeds #{Parser::MAX_PAYLOAD_SIZE} bytes " \
            "(#{Parser::MAX_MEASUREMENTS} measurements); split it across requests",
          )
        end

        def authenticate_session_from_token
          token = bearer_token
          return unless token

          @authenticated_session =
            FixedSession.by_uuid(params[:fixed_session_uuid]).find_by(session_token: token)
        end

        def authenticate_user_from_bearer_token
          return if @authenticated_session

          super
        end

        def require_authentication!
          return if current_user.present? || @authenticated_session.present?

          monitor.report_auth_failure(session_uuid: params[:fixed_session_uuid])
          render_error(ErrorCodes::UNAUTHORIZED, 'Unauthorized')
        end

        def with_server_time_header
          yield
        ensure
          response.set_header('X-Server-Time', Time.now.to_i.to_s)
        end

        def find_session_for_user
          FixedSessionsRepository.new.find_by(
            uuid: params[:fixed_session_uuid],
            user_id: current_user.id,
          )
        end

        def monitor
          @monitor ||= ::BinaryProtocol::Monitor.new(source: ::BinaryProtocol::Monitor::FIXED)
        end
      end
    end
  end
end
