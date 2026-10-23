module Api
  module V3
    class StationStreamDailyAveragesController < BaseController
      def index
        result =
          ::StationStreamDailyAverages::IndexInteractor.new.call(
            params: params.to_unsafe_hash,
          )

        if result.success?
          render json: result.value, status: :ok
        else
          render_failure(result, message: 'Query parameters are invalid')
        end
      end
    end
  end
end
