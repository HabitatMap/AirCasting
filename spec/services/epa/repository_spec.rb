require 'rails_helper'

describe Epa::Repository do
  subject { described_class.new }

  describe '#find_ingest_batch!' do
    it 'returns the batch with given id' do
      batch = create(:epa_ingest_batch)

      result = subject.find_ingest_batch!(batch_id: batch.id)

      expect(result).to eq(batch)
    end

    it 'raises RecordNotFound when batch does not exist' do
      expect { subject.find_ingest_batch!(batch_id: 999_999) }.to raise_error(
        ActiveRecord::RecordNotFound,
      )
    end
  end

  describe '#create_ingest_batch!' do
    it 'creates a new batch' do
      measured_at = Time.parse('2025-07-24 09:00:00 UTC')

      expect {
        subject.create_ingest_batch!(measured_at: measured_at)
      }.to change(EpaIngestBatch, :count).by(1)
    end
  end

  describe '#update_ingest_batch_status!' do
    it 'updates the batch status' do
      batch = create(:epa_ingest_batch, status: 'queued')

      subject.update_ingest_batch_status!(batch: batch, status: :extracted)

      expect(batch.reload.status).to eq('extracted')
    end
  end

  describe '#insert_raw_measurements!' do
    it 'inserts records into epa_raw_measurements' do
      batch = create(:epa_ingest_batch)
      records = [
        {
          epa_ingest_batch_id: batch.id,
          valid_date: '07/24/25',
          valid_time: '09:00',
          aqsid: '060010007',
          sitename: 'Livermore',
          gmt_offset: '-8',
          parameter_name: 'PM2.5',
          reporting_units: 'UG/M3',
          value: 12.5,
          data_source: 'BAAQMD',
        },
      ]

      expect {
        subject.insert_raw_measurements!(records: records)
      }.to change(EpaRawMeasurement, :count).by(1)
    end

    it 'does not raise when records is empty' do
      expect {
        subject.insert_raw_measurements!(records: [])
      }.not_to raise_error
    end
  end
end
