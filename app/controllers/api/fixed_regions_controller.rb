module Api
  class FixedRegionsController < BaseController
    def show
      data = ActiveSupport::JSON.decode(params[:q]).symbolize_keys
      data[:session_ids] ||= []

      respond_with FixedRegionInfo.new.call(data)
    end
  end
end
