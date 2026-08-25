module Api
  module V3
    class FixedStreamsController < BaseController
      def show
        result = ::FixedStreams::ShowInteractor.new.call(stream_id: params[:id])

        if result.success?
          render json: result.value, status: :ok
        else
          render_failure(result)
        end
      end
    end
  end
end
