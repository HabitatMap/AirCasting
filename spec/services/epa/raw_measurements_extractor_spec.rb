require 'rails_helper'

describe Epa::RawMeasurementsExtractor do
  let(:api_client) { instance_double(Epa::ApiClient) }

  subject { described_class.new(api_client: api_client) }

  describe '#call' do
    it 'creates EpaRawMeasurement records' do
      batch =
        create(
          :epa_ingest_batch,
          measured_at: Time.parse('2025-07-24 09:00:00 UTC'),
        )
      hourly_data =
        '07/24/25|09:00|060010007|Livermore|-8|PM2.5|UG/M3|12.5|BAAQMD'
      allow(api_client).to receive(:fetch_hourly_data).and_return(hourly_data)

      subject.call(batch_id: batch.id)

      result = EpaRawMeasurement.find_by(epa_ingest_batch_id: batch.id)

      expect(result.valid_date).to eq('07/24/25')
      expect(result.valid_time).to eq('09:00')
      expect(result.aqsid).to eq('060010007')
      expect(result.sitename).to eq('Livermore')
      expect(result.gmt_offset).to eq('-8')
      expect(result.parameter_name).to eq('PM2.5')
      expect(result.reporting_units).to eq('UG/M3')
      expect(result.value).to eq('12.5')
      expect(result.data_source).to eq('BAAQMD')
    end

    it 'updates batch status to extracted' do
      batch =
        create(
          :epa_ingest_batch,
          measured_at: Time.parse('2025-07-24 09:00:00 UTC'),
        )
      allow(api_client).to receive(:fetch_hourly_data).and_return('')

      subject.call(batch_id: batch.id)

      expect(batch.reload.status).to eq('extracted')
    end

    it 'filters out unsupported parameters' do
      batch =
        create(
          :epa_ingest_batch,
          measured_at: Time.parse('2025-07-24 09:00:00 UTC'),
        )
      hourly_data =
        %w[
          07/24/25|09:00|060010007|Livermore|-8|PM2.5|UG/M3|12.5|BAAQMD
          07/24/25|09:00|060010007|Livermore|-8|CO|PPM|0.5|BAAQMD
          07/24/25|09:00|060010007|Livermore|-8|SO2|PPB|1.0|BAAQMD
        ].join("\n")
      allow(api_client).to receive(:fetch_hourly_data).and_return(hourly_data)

      expect { subject.call(batch_id: batch.id) }.to change(
        EpaRawMeasurement,
        :count,
      ).by(1)
    end

    it 'ignores malformed lines' do
      batch =
        create(
          :epa_ingest_batch,
          measured_at: Time.parse('2025-07-24 09:00:00 UTC'),
        )
      hourly_data =
        [
          '07/24/25|09:00|060010007|Livermore|-8|PM2.5|UG/M3|12.5|BAAQMD',
          'incomplete|line|only',
          '',
          '07/24/25|09:00|060010008|Oakland|-8|PM2.5|UG/M3|14.0|BAAQMD',
        ].join("\n")
      allow(api_client).to receive(:fetch_hourly_data).and_return(hourly_data)

      expect { subject.call(batch_id: batch.id) }.to change(
        EpaRawMeasurement,
        :count,
      ).by(2)
    end

    it 'strips whitespace from field values' do
      batch =
        create(
          :epa_ingest_batch,
          measured_at: Time.parse('2025-07-24 09:00:00 UTC'),
        )
      hourly_data =
        '07/24/25 | 09:00 | 060010007 | Livermore | -8 | PM2.5 | UG/M3 | 12.5 | BAAQMD'
      allow(api_client).to receive(:fetch_hourly_data).and_return(hourly_data)

      subject.call(batch_id: batch.id)

      result = EpaRawMeasurement.find_by(epa_ingest_batch_id: batch.id)
      expect(result.aqsid).to eq('060010007')
      expect(result.valid_time).to eq('09:00')
    end
  end
end
