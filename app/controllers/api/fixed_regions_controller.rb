module Api
  class FixedRegionsController < BaseController
    rescue_from Errors::Api::CouldNotParseJsonParams do |exception|
      render json: 'could not parse request', status: :bad_request
    end

    def show
      GoogleAnalyticsWorker::RegisterEvent.async_call('Fixed regions#show')
      hash = FixedRegionInfo.new.call(stream_ids)
      render json: hash, status: :ok
    end

    private

    def stream_ids
      @stream_ids ||= params.fetch(:stream_ids).split(",")
    end
  end
end
