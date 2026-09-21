module Api
  module V3
    class FixedSessionsController < BaseController
      ErrorCodes = ::FixedSessions::BinaryProtocol::ErrorCodes
      # Basic is only for `create`: released Android and iOS builds already post
      # it there. Nothing else in v3 accepts it.
      before_action :authenticate_user_from_token!, only: :create
      before_action :authenticate_user_from_bearer_token
      before_action :require_authentication!

      def index
        contract = Api::ListFixedSessionsContract.new.call(
          params.permit(:page, :per_page).to_h.symbolize_keys,
        )
        if contract.failure?
          return render_validation_error(
            contract.errors,
            message: 'Query parameters are invalid',
          )
        end

        pagination = contract.to_h
        render json: ::FixedSessions::List.new(
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

      def create
        contract = Api::CreateFixedSessionContract.new.call(
          params.to_unsafe_h.deep_symbolize_keys,
        )
        if contract.failure?
          return render_validation_error(contract.errors)
        end

        result =
          ::FixedSessions::Creator.new.call(
            data: contract.to_h,
            user: current_user,
          )

        if result.success?
          session = result.value[:session]
          render json: {
            # LEGACY: `location` is the name shipped app versions read; kept
            # forever. `share_url` is the same value under the name used
            # everywhere in v3 — new clients should read that one.
            location: short_session_url(session, host: A9n.host_),
            share_url: short_session_url(session, host: A9n.host_),
            session_token: result.value[:session_token],
            streams: result.value[:streams],
          }, status: :created
        else
          render_failure(result)
        end
      end

      def destroy
        session = current_user.fixed_sessions.by_uuid(params[:uuid]).first
        return already_deleted? ? head(:no_content) : session_not_found unless session

        result = ::FixedSessions::Destroyer.new.call(session: session)
        return render_failure(result) unless result.success?

        head :no_content
      end

      private

      def find_owned_session
        current_user
          .fixed_sessions
          .includes(:device, :tags, streams: :threshold_set)
          .by_uuid(params[:uuid])
          .first
      end

      def serialize(session)
        latest_measurements = FixedMeasurementsRepository.new.latest_by_stream_id(
          stream_ids: session.streams.map(&:id),
        )
        ::FixedSessions::SessionSerializer.new.call(
          session,
          latest_measurements: latest_measurements,
        )
      end

      def session_not_found
        render_error(ErrorCodes::SESSION_NOT_FOUND, 'Session not found')
      end

      def already_deleted?
        DeletedSession
          .where(user_id: current_user.id)
          .where('LOWER(uuid) = LOWER(?)', params[:uuid].to_s)
          .exists?
      end
    end
  end
end
