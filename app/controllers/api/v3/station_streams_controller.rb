module Api
  module V3
    class StationStreamsController < BaseController
      def show
        result =
          ::StationStreams::ShowInteractor.new.call(
            station_stream_id: params[:id],
          )

        if result.success?
          render json: result.value, status: :ok
        else
          render json: result.errors, status: :not_found
        end
      end
    end
  end
end
