module Api
  class Fixed::StreamsController < BaseController
    respond_to :json

    def show
      hash =
        Api::ToFixedSessionHash.new(
          measurements_limit: measurements_limit,
          stream: stream,
        ).call
      render json: hash, status: :ok
    end

    private

    def stream
      @stream ||= Stream.includes(:threshold_set).fixed.find(id)
    end

    def id
      @id ||= params.fetch(:id)
    end

    def measurements_limit
      @measurements_limit ||= params.fetch(:measurements_limit, nil)
    end
  end
end
