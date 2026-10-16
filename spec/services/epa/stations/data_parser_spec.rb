require 'rails_helper'

describe Epa::Stations::DataParser do
  let(:sample_data) { file_fixture('epa_locations_v2_sample.dat').read }
  let(:parser) { described_class.new }

  describe '#call' do
    it 'parses streams from the V2 file, skipping the header' do
      rows = parser.call(data: sample_data)

      expect(rows.count).to eq(6)
      expect(rows.map(&:external_ref)).not_to include('StationID')
    end

    it 'extracts stream and station attributes correctly' do
      rows = parser.call(data: sample_data)
      row = rows.first

      expect(row.external_ref).to eq('060010007')
      expect(row.station_external_ref).to eq('840060010007')
      expect(row.measurement_type).to eq('PM2.5')
      expect(row.latitude).to eq(37.687526)
      expect(row.longitude).to eq(-121.784217)
      expect(row.title).to eq('Livermore')
      expect(row.excluded_reason).to be_nil
    end

    it 'normalizes O3 to Ozone' do
      rows = parser.call(data: sample_data)
      ozone_row = rows.find { |s| s.measurement_type == 'Ozone' }

      expect(ozone_row).to be_present
    end

    it 'skips unsupported parameters' do
      rows = parser.call(data: sample_data)
      co_row = rows.find { |s| s.measurement_type == 'CO' }

      expect(co_row).to be_nil
    end

    it 'skips rows with a missing StationID or FullAQSID' do
      rows = parser.call(data: sample_data)

      expect(rows.map(&:external_ref)).not_to include('', nil, '060010012')
    end

    it 'skips rows without a real position' do
      rows = parser.call(data: sample_data)

      expect(rows.map(&:external_ref)).not_to include(
        '070000000000',
        '080000000000',
      )
    end

    it 'marks temporary monitors as excluded' do
      rows = parser.call(data: sample_data)
      row = rows.find { |s| s.external_ref == 'TT1234567890' }

      expect(row.excluded_reason).to eq(
        Station::EXCLUDED_REASONS[:temporary],
      )
    end

    it 'marks a site at a whole-degree placeholder point as having no coordinates' do
      rows =
        parser.call(
          data:
            '210890008|210890008|840210890008|O3|Permanent|0008|' \
              "N/A|Active|KY1|Kentucky|R4|50.000000|-150.000000||-6.00|US||||||\n",
        )

      expect(rows.first.excluded_reason).to eq(
        Station::EXCLUDED_REASONS[:no_coordinates],
      )
    end

    it 'prefers no coordinates over temporary' do
      rows =
        parser.call(
          data:
            'MMTEST001|MMTEST001|840MMTEST001|PM2.5|Temporary|0001|' \
              "Unit1|Active|CA1|California|R9|40.000000|-120.000000||-8.00|US||||||\n",
        )

      expect(rows.first.excluded_reason).to eq(
        Station::EXCLUDED_REASONS[:no_coordinates],
      )
    end

    it 'uses StationID as title when the site name is missing' do
      rows = parser.call(data: sample_data)
      row = rows.find { |s| s.external_ref == '060010011' }

      expect(row.title).to eq('060010011')
    end

    it 'uses StationID as title when the site name is a placeholder' do
      data =
        '150030010|150030010|840150030010|PM2.5|Permanent|0010|' \
          "n/a|Active|HI1|Hawaii|R9|21.3239|-158.0882||-10.00|US||||||\n"
      rows = parser.call(data: data)

      expect(rows.first.title).to eq('150030010')
    end

    it 'keeps accented site names from binary UTF-8 data' do
      data =
        '000050128|000050128|124000050128|PM2.5|Permanent|0128|' \
          'Aéroport de Montréal 1|Active|QC1|Quebec|CA|45.4673|-73.7417||' \
          "-5.00|CA||||||\n"
      rows = parser.call(data: data.b)

      expect(rows.first.title).to eq('Aéroport de Montréal 1')
    end

    it 'collapses runs of spaces in site names' do
      data =
        '060070008|060070008|840060070008|PM2.5|Permanent|0008|' \
          "Chico -  East |Active|CA1|California|R9|39.76168|-121.84047||" \
          "-8.00|US||||||\n"
      rows = parser.call(data: data)

      expect(rows.first.title).to eq('Chico - East')
    end

    it 'deduplicates rows by external_ref and measurement_type' do
      rows = parser.call(data: sample_data)
      pm25_rows = rows.select { |s| s.external_ref == '060010007' && s.measurement_type == 'PM2.5' }

      expect(pm25_rows.count).to eq(1)
    end

    it 'returns rows without enriched fields' do
      rows = parser.call(data: sample_data)
      row = rows.first

      expect(row.location).to be_nil
      expect(row.time_zone).to be_nil
      expect(row.source_id).to be_nil
      expect(row.stream_configuration_id).to be_nil
      expect(row.station_id).to be_nil
    end
  end
end
