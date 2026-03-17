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

      def export
        contract =
          Api::ExportStationStreamsContract.new.call(params.to_unsafe_hash)
        result = Api::ScheduleStationStreamExport.new(contract: contract).call

        if result.success?
          render json: result.value, status: :ok
        else
          render json: result.errors, status: :bad_request
        end
      end
    end
  end
end
