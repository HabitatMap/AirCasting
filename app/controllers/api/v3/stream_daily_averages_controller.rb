module Api
  module V3
    class StreamDailyAveragesController < BaseController
      def index
        result =
          ::StreamDailyAverages::IndexInteractor.new.call(stream_id: params[:stream_id], start_date: params[:start_date], end_date: params[:end_date])

        if result.success?
          render json: result.value, status: :ok
        else
          render json: result.errors, status: :bad_request
        end
      end
    end
  end
end
