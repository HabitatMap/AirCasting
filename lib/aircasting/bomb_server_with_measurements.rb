# Useful to simulate long mobile sessions recordings.
#
# Args:
# - server: http://example.com
# - token: Base64.encode64("#{User.where(username: "HabitatMap").first.authentication_token}:X")

module AirCasting
  class BombServerWithMeasurements
    def call(server:, token:, amount:, session_name:)
      now = Time.current
      data = {
        calibration: 100,
        contribute: true,
        drawable: 2_131_165_443,
        end_time: (now + amount.seconds).iso8601[0..-2],
        is_indoor: false,
        latitude: 0.0,
        longitude: 0.0,
        deleted: false,
        notes: [],
        start_time: now.iso8601[0..-2],
        streams: streams(now, amount),
        tag_list: '',
        title: session_name,
        type: 'MobileSession',
        uuid: SecureRandom.uuid,
        version: 0
      }
      data = { compression: true, session: deflate(data.to_json) }

      HTTParty.post(
        "#{server}/api/sessions",
        headers: { 'Authorization' => "Basic #{token}" }, body: data
      )
    end

    private

    def streams(now, amount)
      {}.merge(phone_microphone(now, amount)) #.merge(humidity(now, amount))
    end

    def phone_microphone(now, amount)
      {
        'Phone Microphone': {
          deleted: false,
          measurement_type: 'Sound Level',
          measurements:
            (1..amount).map do |i|
              {
                longitude: 19.9263968,
                latitude: 50.058191,
                time: (now + i.seconds).iso8601[0..-2],
                timezone_offset: 0,
                milliseconds: 141,
                measured_value: 60.06220481546737,
                value: 60.06220481546737
              }
            end,
          sensor_package_name: 'Builtin',
          sensor_name: 'Phone Microphone',
          measurement_short_type: 'dB',
          unit_symbol: 'dB',
          threshold_high: 80,
          threshold_low: 60,
          threshold_medium: 70,
          threshold_very_high: 100,
          threshold_very_low: 20,
          unit_name: 'decibels'
        }
      }
    end

    def humidity(now, amount)
      {
        'Humidity': {
          deleted: false,
          measurement_type: 'Humidity',
          measurements:
            (1..amount).map do |i|
              {
                longitude: 19.9263968,
                latitude: 50.058191,
                time: (now + i.seconds).iso8601[0..-2],
                timezone_offset: 0,
                milliseconds: 141,
                measured_value: 60.06220481546737,
                value: 60.06220481546737
              }
            end,
          sensor_package_name: 'AirBeam2:123123123',
          sensor_name: 'AirBeam2-RH',
          measurement_short_type: 'RH',
          unit_symbol: '%',
          threshold_high: 75,
          threshold_low: 25,
          threshold_medium: 50,
          threshold_very_high: 100,
          threshold_very_low: 0,
          unit_name: 'percent'
        }
      }
    end

    def deflate(string)
      io = StringIO.new
      gz = Zlib::GzipWriter.new(io)
      gz.write(string)

      gz.close

      Base64.encode64(io.string).force_encoding('UTF-8')
    end
  end
end
