require 'rails_helper'

describe Epa::Measurements::Transformer do
  subject { described_class.new }

  describe '#call' do
    it 'creates EpaTransformedMeasurement records from raw measurements' do
      batch = create(:epa_staging_batch, status: 'extracted')
      create(
        :epa_raw_measurement,
        epa_staging_batch_id: batch.id,
        valid_date: '07/24/25',
        valid_time: '09:00',
        aqsid: '060010007',
        parameter_name: 'PM2.5',
        reporting_units: 'µg/m³',
        value: '12.5',
      )

      subject.call(batch_id: batch.id)

      result = EpaTransformedMeasurement.find_by(epa_staging_batch_id: batch.id)

      expect(result.external_ref).to eq('060010007')
      expect(result.measurement_type).to eq('PM2.5')
      expect(result.measured_at).to eq(Time.zone.parse('2025-07-24 10:00:00'))
      expect(result.value).to eq(12.5)
      expect(result.unit_symbol).to eq('µg/m³')
    end

    it 'updates batch status to completed' do
      batch = create(:epa_staging_batch, status: 'extracted')

      subject.call(batch_id: batch.id)

      expect(batch.reload.status).to eq('completed')
    end

    it 'adds 1 hour to the timestamp' do
      batch = create(:epa_staging_batch, status: 'extracted')
      create(
        :epa_raw_measurement,
        epa_staging_batch_id: batch.id,
        valid_date: '12/31/25',
        valid_time: '23:00',
        parameter_name: 'PM2.5',
        value: '10.0',
      )

      subject.call(batch_id: batch.id)

      result = EpaTransformedMeasurement.find_by(epa_staging_batch_id: batch.id)
      expect(result.measured_at).to eq(Time.zone.parse('2026-01-01 00:00:00'))
    end

    it 'marks batch as completed when there are no raw measurements' do
      batch = create(:epa_staging_batch, status: 'extracted')

      subject.call(batch_id: batch.id)

      expect(batch.reload.status).to eq('completed')
      expect(EpaTransformedMeasurement.count).to eq(0)
    end

    it 'skips records with invalid timestamps' do
      batch = create(:epa_staging_batch, status: 'extracted')
      create(
        :epa_raw_measurement,
        epa_staging_batch_id: batch.id,
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
      batch = create(:epa_staging_batch, status: 'extracted')
      create(
        :epa_raw_measurement,
        epa_staging_batch_id: batch.id,
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

    context 'load worker enqueuing' do
      let(:load_measurements_worker) do
        class_double(Epa::LoadMeasurementsWorker)
      end

      subject do
        described_class.new(load_measurements_worker: load_measurements_worker)
      end

      before { allow(load_measurements_worker).to receive(:perform_async) }

      it 'enqueues load workers when all staging batches in the cycle are done' do
        cycle = create(:epa_ingest_cycle, status: 'staging')
        batch =
          create(
            :epa_staging_batch,
            epa_ingest_cycle: cycle,
            status: 'extracted',
          )
        load_batch = create(:epa_load_batch, epa_ingest_cycle: cycle)

        subject.call(batch_id: batch.id)

        expect(load_measurements_worker).to have_received(:perform_async).with(
          load_batch.id,
        )
      end

      it 'does not enqueue load workers when other staging batches are still pending' do
        cycle = create(:epa_ingest_cycle, status: 'staging')
        batch =
          create(
            :epa_staging_batch,
            epa_ingest_cycle: cycle,
            status: 'extracted',
          )
        _pending =
          create(
            :epa_staging_batch,
            epa_ingest_cycle: cycle,
            status: 'extracted',
          )

        subject.call(batch_id: batch.id)

        expect(load_measurements_worker).not_to have_received(:perform_async)
      end
    end

    it 'upserts records on conflict' do
      old_batch = create(:epa_staging_batch, status: 'completed')
      existing_measurement =
        create(
          :epa_transformed_measurement,
          epa_staging_batch_id: old_batch.id,
          external_ref: '060010007',
          measurement_type: 'PM2.5',
          measured_at: Time.zone.parse('2025-07-24 10:00:00'),
          value: 10.0,
        )

      batch = create(:epa_staging_batch, status: 'extracted')
      create(
        :epa_raw_measurement,
        epa_staging_batch_id: batch.id,
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
      expect(existing_measurement.epa_staging_batch_id).to eq(batch.id)
    end
  end
end
