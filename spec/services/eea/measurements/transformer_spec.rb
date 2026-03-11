require 'rails_helper'

describe Eea::Measurements::Transformer do
  subject { described_class.new }

  # eea_raw_measurements has no AR model (COPY table, id: false).
  # Insert rows directly via SQL.
  def insert_raw_measurement(
    batch_id:,
    samplingpoint: 'SPO.PL0003A',
    pollutant: 6001,
    end_time: '2025-07-24 10:00:00',
    value: 12.5,
    unit: 'µg/m³',
    ingested_at: Time.current
  )
    ActiveRecord::Base.connection.execute(
      ActiveRecord::Base.sanitize_sql_array([
        <<~SQL,
          INSERT INTO eea_raw_measurements
            (eea_ingest_batch_id, samplingpoint, pollutant, end_time, value, unit, ingested_at)
          VALUES
            (?, ?, ?, ?, ?, ?, ?)
        SQL
        batch_id,
        samplingpoint,
        pollutant,
        end_time,
        value,
        unit,
        ingested_at,
      ]),
    )
  end

  describe '#call' do
    it 'creates an EeaTransformedMeasurement record from a raw measurement' do
      batch = create(:eea_ingest_batch, status: 'copied')
      insert_raw_measurement(batch_id: batch.id)

      subject.call(batch_id: batch.id)

      result = EeaTransformedMeasurement.find_by(eea_ingest_batch_id: batch.id)
      expect(result.external_ref).to eq('SPO.PL0003A')
      expect(result.measurement_type).to eq('PM2.5')
      expect(result.measured_at).to eq(Time.zone.parse('2025-07-24 09:00:00'))
      expect(result.value).to eq(12.5)
      expect(result.unit_symbol).to eq('µg/m³')
    end

    it 'updates the batch status to transformed' do
      batch = create(:eea_ingest_batch, status: 'copied')

      subject.call(batch_id: batch.id)

      expect(batch.reload.status).to eq('transformed')
    end

    it 'marks batch as transformed even when there are no raw measurements' do
      batch = create(:eea_ingest_batch, status: 'copied')

      subject.call(batch_id: batch.id)

      expect(batch.reload.status).to eq('transformed')
      expect(EeaTransformedMeasurement.count).to eq(0)
    end

    context 'pollutant code mapping' do
      it 'maps pollutant code 6001 to PM2.5' do
        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(batch_id: batch.id, pollutant: 6001)

        subject.call(batch_id: batch.id)

        expect(EeaTransformedMeasurement.last.measurement_type).to eq('PM2.5')
      end

      it 'maps pollutant code 7 to Ozone' do
        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(batch_id: batch.id, pollutant: 7)

        subject.call(batch_id: batch.id)

        expect(EeaTransformedMeasurement.last.measurement_type).to eq('Ozone')
      end

      it 'maps pollutant code 8 to NO2' do
        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(batch_id: batch.id, pollutant: 8)

        subject.call(batch_id: batch.id)

        expect(EeaTransformedMeasurement.last.measurement_type).to eq('NO2')
      end

      it 'skips records with unknown pollutant codes' do
        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(batch_id: batch.id, pollutant: 9999)

        expect { subject.call(batch_id: batch.id) }.not_to change(
          EeaTransformedMeasurement,
          :count,
        )
      end
    end

    context 'unit conversions' do
      it 'divides Ozone values by 1.96' do
        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(batch_id: batch.id, pollutant: 7, value: 196.0)

        subject.call(batch_id: batch.id)

        expect(EeaTransformedMeasurement.last.value).to eq(100)
      end

      it 'divides NO2 values by 1.88' do
        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(batch_id: batch.id, pollutant: 8, value: 188.0)

        subject.call(batch_id: batch.id)

        expect(EeaTransformedMeasurement.last.value).to eq(100)
      end

      it 'does not convert PM2.5 values' do
        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(batch_id: batch.id, pollutant: 6001, value: 42.5)

        subject.call(batch_id: batch.id)

        expect(EeaTransformedMeasurement.last.value).to eq(42.5)
      end
    end

    context 'external_ref extraction' do
      it 'extracts the station id from a URL-style samplingpoint' do
        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(batch_id: batch.id, samplingpoint: 'GB/SPO.GB1234A')

        subject.call(batch_id: batch.id)

        expect(EeaTransformedMeasurement.last.external_ref).to eq('SPO.GB1234A')
      end

      it 'uses samplingpoint as-is when there is no slash' do
        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(batch_id: batch.id, samplingpoint: 'SPO.PL0003A')

        subject.call(batch_id: batch.id)

        expect(EeaTransformedMeasurement.last.external_ref).to eq('SPO.PL0003A')
      end
    end

    context 'timezone conversion' do
      it 'converts end_time from CET (UTC+1) to UTC for measured_at' do
        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(batch_id: batch.id, end_time: '2025-07-24 10:00:00')

        subject.call(batch_id: batch.id)

        expect(EeaTransformedMeasurement.last.measured_at).to eq(
          Time.zone.parse('2025-07-24 09:00:00'),
        )
      end
    end

    context 'load worker enqueuing' do
      let(:load_measurements_worker) { class_double(Eea::LoadMeasurementsWorker) }

      subject do
        described_class.new(load_measurements_worker: load_measurements_worker)
      end

      before { allow(load_measurements_worker).to receive(:perform_async) }

      it 'enqueues a LoadMeasurementsWorker with the batch id' do
        batch = create(:eea_ingest_batch, status: 'copied')

        subject.call(batch_id: batch.id)

        expect(load_measurements_worker).to have_received(:perform_async).with(batch.id)
      end
    end

    context 'ON CONFLICT upsert behaviour' do
      it 'updates an existing record when the incoming ingested_at is more recent' do
        old_batch = create(:eea_ingest_batch, status: 'transformed')
        create(
          :eea_transformed_measurement,
          eea_ingest_batch_id: old_batch.id,
          external_ref: 'SPO.PL0003A',
          measurement_type: 'PM2.5',
          measured_at: Time.zone.parse('2025-07-24 09:00:00'),
          value: 10.0,
          ingested_at: 1.hour.ago,
        )

        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(
          batch_id: batch.id,
          pollutant: 6001,
          end_time: '2025-07-24 10:00:00',
          value: 15.0,
          ingested_at: Time.current,
        )

        expect { subject.call(batch_id: batch.id) }.not_to change(
          EeaTransformedMeasurement,
          :count,
        )

        updated = EeaTransformedMeasurement.find_by(
          external_ref: 'SPO.PL0003A',
          measurement_type: 'PM2.5',
          measured_at: Time.zone.parse('2025-07-24 09:00:00'),
        )
        expect(updated.value).to eq(15.0)
      end

      it 'keeps the existing record when the incoming ingested_at is older' do
        old_batch = create(:eea_ingest_batch, status: 'transformed')
        existing = create(
          :eea_transformed_measurement,
          eea_ingest_batch_id: old_batch.id,
          external_ref: 'SPO.PL0003A',
          measurement_type: 'PM2.5',
          measured_at: Time.zone.parse('2025-07-24 09:00:00'),
          value: 10.0,
          ingested_at: Time.current,
        )

        batch = create(:eea_ingest_batch, status: 'copied')
        insert_raw_measurement(
          batch_id: batch.id,
          pollutant: 6001,
          end_time: '2025-07-24 10:00:00',
          value: 99.0,
          ingested_at: 1.hour.ago,
        )

        subject.call(batch_id: batch.id)

        expect(existing.reload.value).to eq(10.0)
      end
    end
  end
end
