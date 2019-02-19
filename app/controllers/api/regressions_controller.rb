module Api
  class RegressionsController < BaseController
    respond_to :json
    # TokenAuthenticatable was removed from Devise in 3.1
    # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
    before_filter :authenticate_user_from_token!, only: [:create, :destroy]
    before_filter :authenticate_user!, only: [:create, :destroy]

    def create
      session = current_user.sessions.find_by_uuid!(params[:session_uuid])
      ref = session.streams.where(JSON.parse(params[:reference])).first
      target = session.streams.where(JSON.parse(params[:target])).first
      respond_with Regression.create_for_streams(target, ref, current_user), location: nil
    end

    def index
      respond_with Regression.all_with_owner(current_user), methods: [:is_owner]
    end

    def destroy
      regression = current_user.regressions.find(params[:id])
      regression.destroy
      respond_with regression
    end
  end
end
