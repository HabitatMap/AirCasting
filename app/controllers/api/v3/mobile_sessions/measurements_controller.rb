module Api
  module V3
    module MobileSessions
      class MeasurementsController < BaseController
        ErrorCodes = ::MobileSessions::ErrorCodes
        Parser = ::MobileSessions::BinaryProtocol::Parser
        around_action :with_server_time_header
        before_action :authenticate_user_from_bearer_token
        before_action :require_authentication!

        def index
          session = find_session
          return session_not_found unless session

          data = ::MobileSessions::MeasurementsQuery.new(
            session: session,
            sensor_name: params[:sensor_name],
            measurement_type: params[:measurement_type],
            start_time: params[:start_time],
            end_time: params[:end_time],
          ).call

          render json: data, status: :ok
        end

        def create
          return payload_too_large if declared_size_over_limit?

          binary = request.body.read
          return head :ok if binary.empty?

          session = find_session

          unless session
            monitor.report_session_not_found(session_uuid: params[:mobile_session_uuid])
            return session_not_found
          end

          result = ::MobileSessions::BinaryProtocol::Ingester.new(monitor: monitor).call(
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

        def require_authentication!
          return if current_user

          monitor.report_auth_failure(session_uuid: params[:mobile_session_uuid])
          super
        end

        def monitor
          @monitor ||= ::BinaryProtocol::Monitor.new(source: ::BinaryProtocol::Monitor::MOBILE)
        end

        def find_session
          current_user.mobile_sessions.by_uuid(params[:mobile_session_uuid]).first
        end

        def session_not_found
          render_error(ErrorCodes::SESSION_NOT_FOUND, 'Session not found')
        end

        def with_server_time_header
          yield
        ensure
          response.set_header('X-Server-Time', Time.now.to_i.to_s)
        end
      end
    end
  end
end
