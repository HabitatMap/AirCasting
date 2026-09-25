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

        # The query is validated before the session is looked up, so a malformed
        # request answers the same 400 whatever uuid it carries.
        def index
          contract = ::Api::FixedSessionMeasurementsContract.new.call(query_params)
          return render_validation_error(contract.errors, message: 'Query is invalid') if contract.failure?

          session = find_session
          return session_not_found unless session

          measurements = ::FixedSessions::MeasurementsQuery.new(session: session, **contract.to_h).call
          return stream_not_found(contract[:sensor_name]) if measurements.nil?

          render json: measurements, status: :ok
        end

        def create
          return payload_too_large if declared_size_over_limit?

          binary = request.body.read
          return head :ok if binary.empty?

          session = find_session

          unless session
            monitor.report_session_not_found(
              session_uuid: params[:fixed_session_uuid],
              auth_method: 'user_token',
            )
            return session_not_found
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

        def query_params
          params.to_unsafe_h.slice(:sensor_name, :start_time, :end_time)
        end

        # A named stream the session does not have is a wrong request, not an
        # empty one — an empty array would read as "recorded nothing here".
        def stream_not_found(sensor_name)
          render_error(
            ::Api::V3::ErrorCodes::NOT_FOUND,
            "Session has no stream named #{sensor_name}",
          )
        end

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

          # The monitor watches the ingest path only — a rejected credential on the
          # JSON read is an ordinary 401, not an upload failure, and counting it
          # would blur the upload dashboards.
          monitor.report_auth_failure(session_uuid: params[:fixed_session_uuid]) if action_name == 'create'
          render_error(ErrorCodes::UNAUTHORIZED, 'Unauthorized')
        end

        def with_server_time_header
          yield
        ensure
          response.set_header('X-Server-Time', Time.now.to_i.to_s)
        end

        def find_session
          @authenticated_session || find_session_for_user
        end

        def find_session_for_user
          FixedSessionsRepository.new.find_by(
            uuid: params[:fixed_session_uuid],
            user_id: current_user.id,
          )
        end

        def session_not_found
          render_error(ErrorCodes::SESSION_NOT_FOUND, 'Session not found')
        end

        def monitor
          @monitor ||= ::BinaryProtocol::Monitor.new(source: ::BinaryProtocol::Monitor::FIXED)
        end
      end
    end
  end
end
