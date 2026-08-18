module Api
  module V3
    module MobileSessions
      class MeasurementsController < BaseController
        ErrorCodes = ::MobileSessions::ErrorCodes
        around_action :with_server_time_header
        before_action :authenticate_user_from_token!
        before_action :authenticate_user!

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
          binary = request.body.read
          return head :ok if binary.empty?

          session = find_session
          return session_not_found unless session

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

        def find_session
          current_user.mobile_sessions.find_by(uuid: params[:mobile_session_uuid])
        end

        def session_not_found
          render json: {
            error_code: ErrorCodes::SESSION_NOT_FOUND,
            message: 'Session not found',
          }, status: :not_found
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
