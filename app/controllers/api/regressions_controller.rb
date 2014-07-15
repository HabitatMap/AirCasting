module Api
  class RegressionsController < BaseController
    before_filter :authenticate_user!, only: :create

    def create
      session = Session.find_by_uuid!(params[:session_uuid])
      ref = session.streams.where(:sensor_package_name => params[:reference])
      targets = params[:targets]
      respond_with targets.map { |target|
        reg = Regression.build_for_streams(target, reference)
        reg.save
        reg
      }
    end

    def index
      respond_with Regression.all
    end
  end
end
