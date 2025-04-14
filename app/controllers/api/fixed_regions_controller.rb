module Api
  class FixedRegionsController < BaseController
    def show
      hash = FixedRegionInfo.new.call(stream_ids)
      render json: hash, status: :ok
    end

    private

    def stream_ids
      @stream_ids ||= params.fetch(:stream_ids).split(',')
    end
  end
end
