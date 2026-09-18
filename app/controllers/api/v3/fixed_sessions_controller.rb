module Api
  module V3
    class FixedSessionsController < BaseController
      # Basic is accepted on `create` only, for the shipped app versions that
      # still post it. New operations are bearer-only.
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
    end
  end
end
