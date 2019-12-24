require 'httparty'
require 'uri'

module Api
  class GoogleAnalytics
    def register_event(event_action)
      if A9n.analytics_enabled == 'true'
        HTTParty.post(
          'https://www.google-analytics.com/collect',
          body:
            "v=1&t=event&tid=UA-27599231-2&cid=#{
              URI.encode(client_id)
            }&ec=Endpoint%20Hits&ea=#{event_action}"
        )
      end
    end

    private

    def client_id
      ((rand * 0x7FFFFFFF).floor).to_s + '.' +
        (Time.current.to_i / 1_000).floor.to_s
    end
  end
end
