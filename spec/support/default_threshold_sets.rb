# The rows GET /api/v3/threshold_sets reads, matching db/seeds.rb and
# production. Shared by the request spec and the rswag spec so the documented
# example and the asserted behaviour cannot drift apart.
module DefaultThresholdSets
  AIRBEAM = [
    ['AirBeam-PM1', 'µg/m³', [0, 9, 35, 55, 150]],
    ['AirBeam-PM2.5', 'µg/m³', [0, 9, 35, 55, 150]],
    ['AirBeam-PM10', 'µg/m³', [0, 20, 50, 100, 200]],
    ['AirBeam-RH', '%', [0, 25, 50, 75, 100]],
    ['AirBeam-F', 'F', [15, 45, 75, 105, 135]],
    ['Phone Microphone', 'dB', [20, 60, 70, 80, 100]],
  ].freeze

  GOVERNMENT = [
    ['NO2', 'ppb', [0, 53, 100, 360, 649]],
    ['Ozone', 'ppb', [0, 59, 75, 95, 115]],
    # PM2.5 shares AirBeam-PM2.5's entry, so its bands must match that row.
    ['PM2.5', 'µg/m³', [0, 9, 35, 55, 150]],
  ].freeze

  def create_default_threshold_sets
    AIRBEAM.each do |sensor_name, unit_symbol, bands|
      FactoryBot.create(
        :threshold_set,
        **band_attributes(bands),
        sensor_name: sensor_name,
        unit_symbol: unit_symbol,
        is_default: true,
      )
    end

    GOVERNMENT.each do |measurement_type, unit_symbol, bands|
      FactoryBot.create(
        :stream_configuration,
        **band_attributes(bands),
        measurement_type: measurement_type,
        unit_symbol: unit_symbol,
        canonical: true,
      )
    end
  end

  def band_attributes(bands)
    very_low, low, medium, high, very_high = bands

    {
      threshold_very_low: very_low,
      threshold_low: low,
      threshold_medium: medium,
      threshold_high: high,
      threshold_very_high: very_high,
    }
  end
end

RSpec.configure { |config| config.include DefaultThresholdSets }
