module GoogleAnalyticsWorker
  class RegisterEvent
    include Sidekiq::Worker

    sidekiq_options queue: :critical

    def self.async_call(event_action)
      perform_async(event_action) if A9n.analytics_enabled == 'true'
    end

    def perform(event_action)
      HTTParty.post(
        'https://www.google-analytics.com/collect',
        body:
          "v=1&t=event&tid=UA-27599231-2&cid=#{
            URI.encode(client_id)
          }&ec=Endpoint%20Hits&ea=#{event_action}"
      )
    end

    private

    def client_id
      ((rand * 0x7FFFFFFF).floor).to_s + '.' +
        (Time.current.to_i / 1_000).floor.to_s
    end
  end
end
