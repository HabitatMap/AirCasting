require 'rails_helper'

describe AirNow::ImportMeasurements do
  let!(:user) do
    User.create!(
      email: 'airnow@example.com',
      username: 'US EPA AirNow',
      password: 'abcdefgh'
    )
  end

  it 'creates measurement, stream, session correctly for correct data' do
    locations_data = '000020104|location-name|site-code|site-name|status|agency-id|agency-name|epa-region|44.941101|-105.837799|27.9|timezone|country|msa-code|msa-name|state-code|state-name|county-code|county-name'
    measurements_data = '03/25/24|07:00|000020104|measurement-location|-4|PM2.5|PPB|0.3|attribution'

    locations_array = locations_data.split('|')
    measurements_array = measurements_data.split('|')

    described_class.new(
      locations_data: locations_data,
      hourly_data: measurements_data
    ).call

    [
      [:value, measurements_array[7].to_f],
      [:latitude, locations_array[8].to_f],
      [:longitude, locations_array[9].to_f]
    ].each do |attribute, expected|
      expect(Measurement.first.public_send(attribute)).to eq(expected)
    end

    [
      [:sensor_name, "Government-PM2.5"],
      [:unit_name, "microgram per cubic meter"],
      [:measurement_type, "Particulate Matter"],
      [:measurement_short_type, "PM"],
      [:unit_symbol, "µg/m³"],
      [:threshold_very_low, 0],
      [:threshold_low, 12],
      [:threshold_medium, 35],
      [:threshold_high, 55],
      [:threshold_very_high, 150],
      [:sensor_package_name, "Government-PM2.5"],
    ].each do |attribute, expected|
      expect(Stream.first.public_send(attribute)).to eq(expected)
    end

    [
      [:latitude, locations_array[8].to_f],
      [:longitude, locations_array[9].to_f],
      [:title, locations_array[3]]
    ].each do |attribute, expected|
      expect(Session.first.public_send(attribute)).to eq(expected)
    end
  end
end
