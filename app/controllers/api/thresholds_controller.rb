module Api
  class ThresholdsController < BaseController
    respond_to :json

    def show
      GoogleAnalytics.new.register_event('Thresholds#show')
      render json: Stream.thresholds(params[:id], params[:unit_symbol])
    end
  end
end
