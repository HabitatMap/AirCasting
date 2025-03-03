module Api
  module Fixed
    class ThresholdAlertsController < BaseController
      before_action :authenticate_user_from_token!
      before_action :authenticate_user!
      respond_to :json

      def index
        alerts = current_user.threshold_alerts
        array = Api::ToThresholdAlertsArray.new(alerts: alerts).call

        render json: array.to_json, status: :ok
      end

      def create
        contract =
          Api::ThresholdAlertsContract.new.call(params.to_unsafe_hash[:data])
        result =
          Api::CreateThresholdAlert.new(contract: contract, user: current_user)
            .call

        if result.success?
          render json: { id: result.value }, status: :created
        else
          render json: result.errors, status: :bad_request
        end
      end

      def destroy
        alert = current_user.threshold_alerts.find(params[:id])
        alert&.destroy

        head :no_content
      rescue ActiveRecord::RecordNotFound
        head :unauthorized
      end

      private

      def alert_params
        data = params[:data]
      end
    end
  end
end
