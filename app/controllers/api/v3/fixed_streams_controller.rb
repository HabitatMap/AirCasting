module Api
  module V3
    class FixedStreamsController < BaseController
      def show
        result = ::FixedStreams::ShowInteractor.new.call(stream_id: params[:id])

        if result.success?
          render json: result.value, status: :ok
        else
          render json: result.errors, status: :bad_request
        end
      end
    end
  end
end
