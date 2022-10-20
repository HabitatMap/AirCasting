module Api
  class ToThresholdAlertsArray
    def initialize(alerts:)
      @alerts = alerts
    end

    def call
      alerts.map do |alert|
        {
          id: alert.id,
          session_uuid: alert.session_uuid,
          sensor_name: alert.sensor_name,
          threshold_value: alert.threshold_value,
          frequency: alert.frequency,
          timezone_offset: alert.timezone_offset,
        }
      end
    end

    private

    attr_reader :alerts
  end
end
