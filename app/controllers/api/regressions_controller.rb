module Api
  class RegressionsController < BaseController
    before_filter :authenticate_user!, only: :create

    def create
      session = Session.find_by_uuid!(params[:session_uuid])
      ref = session.streams.where(params[:reference])
      target = session.streams.where(params[:target])
      respond_with Regression.create_for_streams(target, ref)
    end

    def index
      respond_with Regression.all
    end
  end
end
