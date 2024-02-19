module Api
  module V3
    class FixedStreamsController < BaseController
      def show
        if Flipper.enabled?(:calendar)
          result =
            ::FixedStreams::ShowInteractor.new.call(stream_id: params[:id])

          if result.success?
            render json: result.value, status: :ok
          else
            render json: result.errors, status: :bad_request
          end
        else
          head :not_found
        end
      end
    end
  end
end
