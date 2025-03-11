module Api
  class Mobile::StreamsController < BaseController
    respond_to :json

    def show
      hash = Api::ToMobileSessionHash.new(stream: stream).call
      render json: hash, status: :ok
    end

    private

    def stream
      @stream ||= Stream.mobile.find(id)
    end

    def id
      @id ||= params.fetch(:id)
    end
  end
end
