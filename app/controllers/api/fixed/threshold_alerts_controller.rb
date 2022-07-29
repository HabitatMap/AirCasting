module Api
  module Fixed
    class ThresholdAlertsController < BaseController
      before_action :authenticate_user_from_token!
      before_action :authenticate_user!
      respond_to :json

      def create
        form =
          Api::ParamsForm.new(
            params: params.to_unsafe_hash[:data].symbolize_keys,
            schema: Api::ThresholdAlerts::Schema,
            struct: Api::ThresholdAlerts::Struct
          )
        result = Api::CreateThresholdAlert.new(form: form, user: current_user).call

        if result.success?
          render json: result.value, status: :ok
        else
          render json: result.errors, status: :bad_request
        end
      end

      def destroy_alert
        data = params[:data].to_unsafe_hash.symbolize_keys
        alert = ThresholdAlert.where(session_uuid: data[:session_uuid], sensor_name: data[:sensor_name]).first
        alert.destroy

        head :no_content
      end

      private

      def alert_params
        data = params[:data]
      end
    end
  end
end
