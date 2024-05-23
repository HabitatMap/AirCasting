module Api
  class ThresholdsController < BaseController
    respond_to :json

    def show
      GoogleAnalyticsWorker::RegisterEvent.async_call('Thresholds#show')
      render json: ThresholdSetSerializer.new.call(Stream.thresholds(id, unit_symbol))
    end

    private

    def id
      @id ||= params.fetch(:id)
    end

    def unit_symbol
      @unit_symbol ||= params.fetch(:unit_symbol)
    end
  end
end
