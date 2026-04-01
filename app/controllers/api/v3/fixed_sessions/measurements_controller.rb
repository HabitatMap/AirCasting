module Api
  module V3
    module FixedSessions
      class MeasurementsController < BaseController
        before_action :authenticate_user_from_token!
        before_action :authenticate_session_from_token!
        before_action :require_authentication!

        def create
          session = @authenticated_session || find_session_for_user
          return render json: { error: 'session not found' }, status: :not_found unless session

          binary = request.body.read
          result = ::FixedSessions::AirBeamMini2::Ingester.new.call(
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

          render json: { error: 'Unauthorized' }, status: :unauthorized
        end

        def bearer_token
          auth = request.authorization
          auth.sub('Bearer ', '') if auth&.start_with?('Bearer ')
        end

        def find_session_for_user
          FixedSessionsRepository.new.find_by(
            uuid: params[:fixed_session_uuid],
            user_id: current_user.id,
          )
        end
      end
    end
  end
end
