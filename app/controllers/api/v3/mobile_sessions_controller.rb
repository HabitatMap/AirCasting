module Api
  module V3
    class MobileSessionsController < BaseController
      ErrorCodes = ::MobileSessions::ErrorCodes
      before_action :authenticate_user_from_bearer_token
      before_action :require_authentication!

      def index
        contract = Api::ListMobileSessionsContract.new.call(
          params.to_unsafe_h.deep_symbolize_keys,
        )
        if contract.failure?
          return render_validation_error(
            contract.errors,
            message: 'Query parameters are invalid',
          )
        end

        pagination = contract.to_h
        render json: ::MobileSessions::List.new(
          user: current_user,
          page: pagination[:page],
          per_page: pagination[:per_page],
        ).call, status: :ok
      end

      def show
        session = find_owned_session
        return session_not_found unless session

        render json: serialize(session), status: :ok
      end

      def update
        session = current_user.mobile_sessions.by_uuid(params[:uuid]).first
        return session_not_found unless session

        contract = Api::UpdateMobileSessionContract.new.call(
          params.to_unsafe_h.deep_symbolize_keys,
        )
        if contract.failure?
          return render_validation_error(contract.errors)
        end

        result = ::MobileSessions::Updater.new.call(session: session, data: contract.to_h)
        if result.success?
          render json: serialize(find_owned_session), status: :ok
        else
          render_failure(result)
        end
      end

      def destroy
        session = current_user.mobile_sessions.by_uuid(params[:uuid]).first
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
          return render_validation_error(contract.errors)
        end

        result =
          ::MobileSessions::Creator.new.call(
            data: contract.to_h,
            user: current_user,
          )

        if result.success?
          session = result.value[:session]
          render json: {
            share_url: short_session_url(session, host: A9n.host_),
            streams: result.value[:streams],
          }, status: :created
        else
          render_failure(result)
        end
      end

      private

      def find_owned_session
        current_user
          .mobile_sessions
          .includes(:device, :tags, streams: :threshold_set)
          .by_uuid(params[:uuid])
          .first
      end

      def session_not_found
        render_error(ErrorCodes::SESSION_NOT_FOUND, 'Session not found')
      end

      def serialize(session)
        ::MobileSessions::SessionSerializer.new.call(session)
      end
    end
  end
end
