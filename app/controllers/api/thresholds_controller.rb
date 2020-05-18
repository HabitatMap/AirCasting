module Api
  class ThresholdsController < BaseController
    respond_to :json

    def show
      GoogleAnalyticsWorker::RegisterEvent.async_call('Thresholds#show')
      render json: Stream.thresholds(params[:id], params[:unit_symbol])
    end
  end
end
