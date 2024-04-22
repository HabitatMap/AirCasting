module Api
  module V3
    class FlipperController < ApplicationController
      def enabled?
        feature = params[:feature_key]
        is_enabled = Flipper.enabled?(feature)

        render json: { enabled: is_enabled }, status: :ok
      end
    end
  end
end
