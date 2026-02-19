require 'rails_helper'

describe Epa::MeasurementsTransformer do
  subject { described_class.new }

  describe '#call' do
    it 'creates EpaTransformedMeasurement records from raw measurements' do
      batch = create(:epa_ingest_batch, status: 'extracted')
      create(
        :epa_raw_measurement,
        epa_ingest_batch_id: batch.id,
        valid_date: '07/24/25',
        valid_time: '09:00',
        aqsid: '060010007',
        parameter_name: 'PM2.5',
        reporting_units: 'µg/m³',
        value: '12.5',
      )

      subject.call(batch_id: batch.id)

      result = EpaTransformedMeasurement.find_by(epa_ingest_batch_id: batch.id)

      expect(result.external_ref).to eq('060010007')
      expect(result.measurement_type).to eq('PM2.5')
      expect(result.measured_at).to eq(Time.zone.parse('2025-07-24 10:00:00'))
      expect(result.value).to eq(12.5)
      expect(result.unit_symbol).to eq('µg/m³')
    end

    it 'updates batch status to transformed' do
      batch = create(:epa_ingest_batch, status: 'extracted')

      subject.call(batch_id: batch.id)

      expect(batch.reload.status).to eq('transformed')
    end

    it 'adds 1 hour to the timestamp' do
      batch = create(:epa_ingest_batch, status: 'extracted')
      create(
        :epa_raw_measurement,
        epa_ingest_batch_id: batch.id,
        valid_date: '12/31/25',
        valid_time: '23:00',
        parameter_name: 'PM2.5',
        value: '10.0',
      )

      subject.call(batch_id: batch.id)

      result = EpaTransformedMeasurement.find_by(epa_ingest_batch_id: batch.id)
      expect(result.measured_at).to eq(Time.zone.parse('2026-01-01 00:00:00'))
    end

    it 'normalizes parameter_name to measurement_type' do
      batch = create(:epa_ingest_batch, status: 'extracted')
      create(:epa_raw_measurement, epa_ingest_batch_id: batch.id, aqsid: '001', parameter_name: 'PM2.5')
      create(:epa_raw_measurement, epa_ingest_batch_id: batch.id, aqsid: '002', parameter_name: 'O3')
      create(:epa_raw_measurement, epa_ingest_batch_id: batch.id, aqsid: '003', parameter_name: 'OZONE')
      create(:epa_raw_measurement, epa_ingest_batch_id: batch.id, aqsid: '004', parameter_name: 'NO2')

      subject.call(batch_id: batch.id)

      expect(EpaTransformedMeasurement.find_by(external_ref: '001').measurement_type).to eq('PM2.5')
      expect(EpaTransformedMeasurement.find_by(external_ref: '002').measurement_type).to eq('Ozone')
      expect(EpaTransformedMeasurement.find_by(external_ref: '003').measurement_type).to eq('Ozone')
      expect(EpaTransformedMeasurement.find_by(external_ref: '004').measurement_type).to eq('NO2')
    end

    it 'skips records with invalid timestamps' do
      batch = create(:epa_ingest_batch, status: 'extracted')
      create(
        :epa_raw_measurement,
        epa_ingest_batch_id: batch.id,
        valid_date: 'invalid',
        valid_time: '09:00',
        parameter_name: 'PM2.5',
        value: '12.5',
      )

      expect { subject.call(batch_id: batch.id) }.not_to change(
        EpaTransformedMeasurement,
        :count,
      )
    end

    it 'skips records with invalid values' do
      batch = create(:epa_ingest_batch, status: 'extracted')
      create(
        :epa_raw_measurement,
        epa_ingest_batch_id: batch.id,
        valid_date: '07/24/25',
        valid_time: '09:00',
        parameter_name: 'PM2.5',
        value: 'N/A',
      )

      expect { subject.call(batch_id: batch.id) }.not_to change(
        EpaTransformedMeasurement,
        :count,
      )
    end

    it 'upserts records on conflict' do
      old_batch = create(:epa_ingest_batch, status: 'transformed')
      existing_measurement =
        create(
          :epa_transformed_measurement,
          epa_ingest_batch_id: old_batch.id,
          external_ref: '060010007',
          measurement_type: 'PM2.5',
          measured_at: Time.zone.parse('2025-07-24 10:00:00'),
          value: 10.0,
        )

      batch = create(:epa_ingest_batch, status: 'extracted')
      create(
        :epa_raw_measurement,
        epa_ingest_batch_id: batch.id,
        aqsid: '060010007',
        valid_date: '07/24/25',
        valid_time: '09:00',
        parameter_name: 'PM2.5',
        value: '15.0',
      )

      expect { subject.call(batch_id: batch.id) }.not_to change(
        EpaTransformedMeasurement,
        :count,
      )

      existing_measurement.reload
      expect(existing_measurement.value).to eq(15.0)
      expect(existing_measurement.epa_ingest_batch_id).to eq(batch.id)
    end
  end
end
