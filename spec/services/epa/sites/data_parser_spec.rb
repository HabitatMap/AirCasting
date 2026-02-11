require 'rails_helper'

describe Epa::Sites::DataParser do
  let(:sample_data) { file_fixture('epa_locations_sample.dat').read }
  let(:time_zone_finder) { instance_double(TimeZoneFinderWrapper) }
  let(:parser) { described_class.new(time_zone_finder: time_zone_finder) }

  before do
    allow(time_zone_finder).to receive(:time_zone_at).and_return('America/Los_Angeles')
  end

  describe '#call' do
    it 'parses sites from pipe-delimited data' do
      create(:source, name: 'EPA')
      create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
      create(:stream_configuration, measurement_type: 'Ozone', canonical: true)
      create(:stream_configuration, measurement_type: 'NO2', canonical: true)

      sites = parser.call(data: sample_data)

      expect(sites.count).to eq(5)
    end

    it 'extracts station attributes correctly' do
      create(:source, name: 'EPA')
      create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
      create(:stream_configuration, measurement_type: 'Ozone', canonical: true)
      create(:stream_configuration, measurement_type: 'NO2', canonical: true)

      sites = parser.call(data: sample_data)
      site = sites.first

      expect(site.external_ref).to eq('060010007')
      expect(site.measurement_type).to eq('PM2.5')
      expect(site.latitude).to eq(37.687526)
      expect(site.longitude).to eq(-121.784217)
      expect(site.title).to eq('Livermore')
    end

    it 'normalizes OZONE to Ozone' do
      create(:source, name: 'EPA')
      create(:stream_configuration, measurement_type: 'Ozone', canonical: true)

      sites = parser.call(data: sample_data)
      ozone_site = sites.find { |s| s.measurement_type == 'Ozone' }

      expect(ozone_site).to be_present
    end

    it 'skips unsupported parameters' do
      create(:source, name: 'EPA')
      create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
      create(:stream_configuration, measurement_type: 'Ozone', canonical: true)
      create(:stream_configuration, measurement_type: 'NO2', canonical: true)

      sites = parser.call(data: sample_data)
      co_site = sites.find { |s| s.measurement_type == 'CO' }

      expect(co_site).to be_nil
    end

    it 'skips rows with missing AQSID' do
      create(:source, name: 'EPA')
      create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
      create(:stream_configuration, measurement_type: 'Ozone', canonical: true)
      create(:stream_configuration, measurement_type: 'NO2', canonical: true)

      sites = parser.call(data: sample_data)
      aqsids = sites.map(&:external_ref)

      expect(aqsids).not_to include('')
      expect(aqsids).not_to include(nil)
    end

    it 'uses AQSID as title when site name is missing' do
      create(:source, name: 'EPA')
      create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
      create(:stream_configuration, measurement_type: 'Ozone', canonical: true)
      create(:stream_configuration, measurement_type: 'NO2', canonical: true)

      sites = parser.call(data: sample_data)
      site = sites.find { |s| s.external_ref == '060010011' }

      expect(site.title).to eq('060010011')
    end

    it 'deduplicates sites by external_ref and measurement_type' do
      data = <<~DATA
        060010007|PM2.5|0007|Livermore|Active|CA0007|BAAQMD|R9|37.687526|-121.784217|0|-8|US|41860|SF|06|California|001|Alameda
        060010007|PM2.5|0007|Livermore Updated|Active|CA0007|BAAQMD|R9|37.687526|-121.784217|0|-8|US|41860|SF|06|California|001|Alameda
      DATA
      create(:source, name: 'EPA')
      create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)

      sites = parser.call(data: data)

      expect(sites.count).to eq(1)
    end

    it 'enriches sites with location and timezone' do
      create(:source, name: 'EPA')
      create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
      create(:stream_configuration, measurement_type: 'Ozone', canonical: true)
      create(:stream_configuration, measurement_type: 'NO2', canonical: true)

      sites = parser.call(data: sample_data)
      site = sites.first

      expect(site.location).to be_present
      expect(site.time_zone).to eq('America/Los_Angeles')
      expect(site.source_id).to be_present
      expect(site.stream_configuration_id).to be_present
    end
  end
end
