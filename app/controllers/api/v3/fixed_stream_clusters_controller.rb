module Api
  module V3
    class FixedStreamClustersController < BaseController
      def index
        averages = Timelapse::TimeSlicesTraverser.new.call(time_shift: timelapse_time_shift, clusters: params[:clusters])

        render json: averages, status: :ok
      end

      private

      def timelapse_time_shift
        case params[:time_period]
        when '1.day'
          1.day/24
        when '3.days'
          3.days/24
        when '7.days'
          7.days/24
        end
      end
    end
  end
end
