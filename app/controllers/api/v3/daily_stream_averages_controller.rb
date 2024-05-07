module Api
  module V3
    class DailyStreamsAveragesController < BaseController
      def show
        if Flipper.enabled?(:calendar)
          averages = StreamDailyAveragesRepository.new.from_time_range(stream_id: params[:id], start_date: params[:start_date], end_date: params[:end_date])
          serialized_averages = DailyStreamsAveragesSerializer.new.call(averages)

          if serialized_averages.present?
            render json: serialized_averages status: :ok
          else
            render json: serialized_averages.errors, status: :bad_request
          end
        else
          head :not_found
        end
      end
    end
  end
end
