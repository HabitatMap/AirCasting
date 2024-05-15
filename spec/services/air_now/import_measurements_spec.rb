require 'rails_helper'

# locations aqsid|parameter|site_code|site_name|status|agency_id|agency_name|epa_region|latitude|longitude|elevation|timezone|country|msa_code|msa_name|state_code|state_name|county_code|county_name
# measurements date|time|aqsid|location|timezone|parameter|unit|value|attribution

describe AirNow::ImportMeasurements do
  let!(:user) do
    User.create!(
      email: 'airnow@example.com',
      username: 'US EPA AirNow',
      password: 'abcdefgh'
    )
  end

  let(:mock_import_data) { instance_double(AirNow::ImportData) }
  let(:locations_data) { "000020104|location-name|site-code|site-name|status|agency-id|agency-name|epa-region|44.941101|-105.837799|27.9|timezone|country|msa-code|msa-name|state-code|state-name|county-code|county-name" }
  let(:measurements_data) { ["03/25/24|07:00|000020104|measurement-location|-4|PM2.5|PPB|0.3|attribution"] }

  before do
    allow(AirNow::ImportData).to receive(:new).and_return(mock_import_data)
    allow(mock_import_data).to receive(:call).and_return([locations_data, measurements_data])
  end

  it 'creates measurement, stream, session correctly for correct data' do
    described_class.new.call

    locations_array = locations_data.split('|')
    measurements_array = measurements_data.first.split('|')

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

  context 'with unwanted parameters' do
    let(:measurements_data) do
      ["03/25/24|07:00|000020104|measurement-location|-4|SO2|PPB|0.3|attribution\n" +
      "03/25/24|07:00|000020104|measurement-location|-4|NO2|PPB|0.3|attribution"]
    end

    before do
      allow(mock_import_data).to receive(:call).and_return([locations_data, measurements_data])
      described_class.new.call
    end

    it 'does not create measurement, stream, session for unwanted parameter' do
      expect(Measurement.count).to eq(1)
      expect(Stream.count).to eq(1)
      expect(Session.count).to eq(1)
    end
  end

  context 'with multiple correct measurements in the same location' do
    let(:measurements_data) do
      ["03/25/24|07:00|000020104|measurement-location|-4|PM2.5|PPB|0.3|attribution\n" +
      "03/25/24|07:00|000020104|measurement-location|-4|NO2|PPB|0.3|attribution"]
    end

    before do
      allow(mock_import_data).to receive(:call).and_return([locations_data, measurements_data])
      described_class.new.call
    end

    it 'creates one session for multiple correct measurements and streams in the same location' do
      expect(Measurement.count).to eq(2)
      expect(Stream.count).to eq(2)
      expect(Session.count).to eq(1)
    end
  end
end
