module Api
  module V3
    class FixedStreamClustersController < BaseController
      def index
        averages = Timelapse::ClustersTraverser.new.call(time_period: timelapse_time_shift, clusters: params[:clusters])

        render json: averages, status: :ok
      end

      private

      def timelapse_time_shift
        case params[:time_period]
        when '1.day'
          1
        when '3.days'
          3
        when '7.days'
          7
        end
      end
    end
  end
end
