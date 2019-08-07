module Api
  class SensorsController < BaseController
    respond_to :json

    def index
      GoogleAnalytics.new.register_event('Sensors#index')
      cache_control =
        ["max-age=#{8.hours}", 'public', 'must_revalidate'].join(', ')
      response.headers['Cache-Control'] = cache_control

      render json: Stream.sensors
    end
  end
end
