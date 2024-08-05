module Api
  module V3
    class FixedStreamClustersController < BaseController
      def index
        averages =
          Timelapse::TimeSlicesTraverser.new.call(
            time_period: params[:time_period],
            clusters: params[:clusters]
          )

        render json: averages, status: :ok
      end
    end
  end
end
