module Api
  module V3
    class MobileSessionsController < BaseController
      ErrorCodes = ::FixedSessions::BinaryProtocol::ErrorCodes
      before_action :authenticate_user_from_token!
      before_action :authenticate_user!

      def index
        render json: ::MobileSessions::List.new(
          user: current_user,
          page: params[:page],
          per_page: params[:per_page],
        ).call, status: :ok
      end

      def show
        session = find_owned_session
        return session_not_found unless session

        render json: serialize(session), status: :ok
      end

      def update
        session = current_user.mobile_sessions.find_by(uuid: params[:uuid])
        return session_not_found unless session

        contract = Api::UpdateMobileSessionContract.new.call(
          params.to_unsafe_h.deep_symbolize_keys,
        )
        if contract.failure?
          return render json: {
            error_code: ErrorCodes::VALIDATION_ERROR,
            message: 'Request body is invalid',
            fields: contract.errors.to_h,
          }, status: :bad_request
        end

        result = ::MobileSessions::Updater.new.call(session: session, data: contract.to_h)
        if result.success?
          render json: serialize(find_owned_session), status: :ok
        else
          render json: result.errors, status: :bad_request
        end
      end

      def destroy
        session = current_user.mobile_sessions.find_by(uuid: params[:uuid])
        return session_not_found unless session

        # Cascades streams/measurements/notes and writes a deleted_sessions
        # tombstone (Session#after_destroy).
        session.destroy!
        head :no_content
      end

      def create
        contract = Api::CreateMobileSessionContract.new.call(
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
          ::MobileSessions::Creator.new.call(
            data: contract.to_h,
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

      private

      def find_owned_session
        current_user
          .mobile_sessions
          .includes(:device, :tags, streams: :threshold_set)
          .find_by(uuid: params[:uuid])
      end

      def session_not_found
        render json: {
          error_code: ErrorCodes::SESSION_NOT_FOUND,
          message: 'Session not found',
        }, status: :not_found
      end

      def serialize(session)
        ::MobileSessions::SessionSerializer.new.call(session)
      end
    end
  end
end
