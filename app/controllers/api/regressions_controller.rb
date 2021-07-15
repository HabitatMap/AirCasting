module Api
  class RegressionsController < BaseController
    respond_to :json

    # TokenAuthenticatable was removed from Devise in 3.1
    # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
    before_action :authenticate_user_from_token!, only: %i[create destroy]
    before_action :authenticate_user!, only: %i[create destroy]

    def create
      GoogleAnalyticsWorker::RegisterEvent.async_call('Regressions#create')
      session = current_user.sessions.find_by_uuid!(params[:session_uuid])
      ref = session.streams.where(JSON.parse(params[:reference])).first
      target = session.streams.where(JSON.parse(params[:target])).first
      respond_with Regression.create_for_streams(target, ref, current_user),
                   location: nil
    end

    def index
      GoogleAnalyticsWorker::RegisterEvent.async_call('Regressions#index')
      respond_with Regression.all_with_owner(current_user),
                   methods: %i[is_owner]
    end

    def destroy
      GoogleAnalyticsWorker::RegisterEvent.async_call('Regressions#destroy')
      regression = current_user.regressions.find(params[:id])
      regression.destroy
      respond_with regression
    end
  end
end
