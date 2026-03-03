require 'rails_helper'

describe Epa::Repository do
  subject { described_class.new }

  describe '#find_staging_batch!' do
    it 'returns the batch with given id' do
      batch = create(:epa_staging_batch)

      result = subject.find_staging_batch!(batch_id: batch.id)

      expect(result).to eq(batch)
    end
  end

  describe '#create_staging_batch!' do
    it 'creates a new batch' do
      measured_at = Time.parse('2025-07-24 09:00:00 UTC')
      cycle = create(:epa_ingest_cycle)

      expect {
        subject.create_staging_batch!(
          measured_at: measured_at,
          epa_ingest_cycle_id: cycle.id,
        )
      }.to change(EpaStagingBatch, :count).by(1)
    end
  end

  describe '#create_ingest_cycle!' do
    it 'creates a new cycle' do
      window_starts_at = Time.parse('2025-07-24 00:00:00 UTC')
      window_ends_at = Time.parse('2025-07-24 23:00:00 UTC')

      expect {
        subject.create_ingest_cycle!(
          window_starts_at: window_starts_at,
          window_ends_at: window_ends_at,
        )
      }.to change(EpaIngestCycle, :count).by(1)
    end
  end

  describe '#create_load_batches_for_cycle!' do
    it 'creates a load batch for each measurement type' do
      cycle = create(:epa_ingest_cycle)

      expect {
        subject.create_load_batches_for_cycle!(cycle_id: cycle.id)
      }.to change(EpaLoadBatch, :count).by(Epa::MEASUREMENT_TYPES.size)
    end
  end

  describe '#try_start_loading' do
    it 'transitions cycle to loading when all staging batches are completed' do
      cycle = create(:epa_ingest_cycle, status: 'staging')
      create(:epa_staging_batch, epa_ingest_cycle: cycle, status: 'completed')
      create(:epa_staging_batch, epa_ingest_cycle: cycle, status: 'completed')

      result = subject.try_start_loading(cycle_id: cycle.id)

      expect(result).to be true
      expect(cycle.reload.status).to eq('loading')
    end

    it 'treats failed staging batches as terminal' do
      cycle = create(:epa_ingest_cycle, status: 'staging')
      create(:epa_staging_batch, epa_ingest_cycle: cycle, status: 'completed')
      create(:epa_staging_batch, epa_ingest_cycle: cycle, status: 'failed')

      result = subject.try_start_loading(cycle_id: cycle.id)

      expect(result).to be true
      expect(cycle.reload.status).to eq('loading')
    end

    it 'returns false when some staging batches are not yet completed' do
      cycle = create(:epa_ingest_cycle, status: 'staging')
      create(:epa_staging_batch, epa_ingest_cycle: cycle, status: 'completed')
      create(:epa_staging_batch, epa_ingest_cycle: cycle, status: 'extracted')

      result = subject.try_start_loading(cycle_id: cycle.id)

      expect(result).to be false
      expect(cycle.reload.status).to eq('staging')
    end

    it 'returns false when cycle is already loading' do
      cycle = create(:epa_ingest_cycle, status: 'loading')
      create(:epa_staging_batch, epa_ingest_cycle: cycle, status: 'completed')

      result = subject.try_start_loading(cycle_id: cycle.id)

      expect(result).to be false
    end
  end

  describe '#try_complete_cycle' do
    it 'transitions cycle to completed when all load batches are completed' do
      cycle = create(:epa_ingest_cycle, status: 'loading')
      create(
        :epa_load_batch,
        epa_ingest_cycle: cycle,
        measurement_type: 'PM2.5',
        status: 'completed',
      )
      create(
        :epa_load_batch,
        epa_ingest_cycle: cycle,
        measurement_type: 'Ozone',
        status: 'completed',
      )

      result = subject.try_complete_cycle(cycle_id: cycle.id)

      expect(result).to be true
      expect(cycle.reload.status).to eq('completed')
    end

    it 'returns false when some load batches are not yet completed' do
      cycle = create(:epa_ingest_cycle, status: 'loading')
      create(
        :epa_load_batch,
        epa_ingest_cycle: cycle,
        measurement_type: 'PM2.5',
        status: 'completed',
      )
      create(
        :epa_load_batch,
        epa_ingest_cycle: cycle,
        measurement_type: 'Ozone',
        status: 'queued',
      )

      result = subject.try_complete_cycle(cycle_id: cycle.id)

      expect(result).to be false
      expect(cycle.reload.status).to eq('loading')
    end

    it 'returns false when cycle is not in loading state' do
      cycle = create(:epa_ingest_cycle, status: 'staging')
      create(:epa_load_batch, epa_ingest_cycle: cycle, status: 'completed')

      result = subject.try_complete_cycle(cycle_id: cycle.id)

      expect(result).to be false
    end
  end

  describe '#find_load_batch!' do
    it 'returns the load batch with given id' do
      load_batch = create(:epa_load_batch)

      result = subject.find_load_batch!(load_batch_id: load_batch.id)

      expect(result).to eq(load_batch)
    end
  end

  describe '#update_load_batch_status!' do
    it 'updates the load batch status' do
      load_batch = create(:epa_load_batch, status: 'queued')

      subject.update_load_batch_status!(
        load_batch: load_batch,
        status: :completed,
      )

      expect(load_batch.reload.status).to eq('completed')
    end
  end

  describe '#find_load_batch_ids' do
    it 'returns ids of all load batches for a cycle' do
      cycle = create(:epa_ingest_cycle)
      other_cycle =
        create(
          :epa_ingest_cycle,
          window_starts_at: Time.parse('2025-06-01 00:00:00 UTC'),
          window_ends_at: Time.parse('2025-06-01 23:00:00 UTC'),
        )
      batch1 =
        create(
          :epa_load_batch,
          epa_ingest_cycle: cycle,
          measurement_type: 'PM2.5',
        )
      batch2 =
        create(
          :epa_load_batch,
          epa_ingest_cycle: cycle,
          measurement_type: 'Ozone',
        )
      _other =
        create(
          :epa_load_batch,
          epa_ingest_cycle: other_cycle,
          measurement_type: 'NO2',
        )

      result = subject.find_load_batch_ids(cycle_id: cycle.id)

      expect(result).to contain_exactly(batch1.id, batch2.id)
    end
  end

  describe '#update_staging_batch_status!' do
    it 'updates the batch status' do
      batch = create(:epa_staging_batch, status: 'queued')

      subject.update_staging_batch_status!(batch: batch, status: :extracted)

      expect(batch.reload.status).to eq('extracted')
    end
  end

  describe '#find_raw_measurements' do
    it 'returns raw measurements for the given batch' do
      batch = create(:epa_staging_batch)
      other_batch = create(:epa_staging_batch)
      measurement = create(:epa_raw_measurement, epa_staging_batch_id: batch.id)
      _other =
        create(:epa_raw_measurement, epa_staging_batch_id: other_batch.id)

      result = subject.find_raw_measurements(batch_id: batch.id)

      expect(result.map(&:id)).to contain_exactly(measurement.id)
    end
  end

  describe '#insert_raw_measurements!' do
    it 'inserts records into epa_raw_measurements' do
      batch = create(:epa_staging_batch)
      records = [
        {
          epa_staging_batch_id: batch.id,
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

      expect { subject.insert_raw_measurements!(records: records) }.to change(
        EpaRawMeasurement,
        :count,
      ).by(1)
    end

    it 'does not raise when records is empty' do
      expect {
        subject.insert_raw_measurements!(records: [])
      }.not_to raise_error
    end
  end

  describe '#upsert_transformed_measurements!' do
    it 'inserts new transformed measurement records' do
      batch = create(:epa_staging_batch)
      records = [
        {
          epa_staging_batch_id: batch.id,
          external_ref: 'ABC123',
          measurement_type: 'PM2.5',
          measured_at: Time.zone.parse('2025-07-24 10:00:00'),
          value: 12.5,
          unit_symbol: 'µg/m³',
          ingested_at: Time.current,
        },
      ]

      expect {
        subject.upsert_transformed_measurements!(records: records)
      }.to change(EpaTransformedMeasurement, :count).by(1)
    end

    it 'updates value and batch reference on conflict' do
      old_batch = create(:epa_staging_batch, status: 'completed')
      existing =
        create(
          :epa_transformed_measurement,
          epa_staging_batch_id: old_batch.id,
          external_ref: 'ABC123',
          measurement_type: 'PM2.5',
          measured_at: Time.zone.parse('2025-07-24 10:00:00'),
          value: 10.0,
        )

      new_batch = create(:epa_staging_batch)
      records = [
        {
          epa_staging_batch_id: new_batch.id,
          external_ref: 'ABC123',
          measurement_type: 'PM2.5',
          measured_at: Time.zone.parse('2025-07-24 10:00:00'),
          value: 15.0,
          unit_symbol: 'µg/m³',
          ingested_at: Time.current,
        },
      ]

      expect {
        subject.upsert_transformed_measurements!(records: records)
      }.not_to change(EpaTransformedMeasurement, :count)

      existing.reload
      expect(existing.value).to eq(15.0)
      expect(existing.epa_staging_batch_id).to eq(new_batch.id)
    end

    it 'does not raise when records is empty' do
      expect {
        subject.upsert_transformed_measurements!(records: [])
      }.not_to raise_error
    end
  end

  describe '#loadable_measurements_data' do
    let(:epa_source) { create(:source, name: 'EPA') }
    let(:cycle) { create(:epa_ingest_cycle) }
    let(:batch) { create(:epa_staging_batch, epa_ingest_cycle: cycle) }
    let(:load_batch) do
      create(
        :epa_load_batch,
        epa_ingest_cycle: cycle,
        measurement_type: 'PM2.5',
      )
    end
    let(:stream_configuration) do
      create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
    end

    it 'returns measurements matched to station streams' do
      station_stream =
        create(
          :station_stream,
          external_ref: 'ABC123',
          stream_configuration: stream_configuration,
          source: epa_source,
        )
      create(
        :epa_transformed_measurement,
        epa_staging_batch_id: batch.id,
        external_ref: 'ABC123',
      )

      result = subject.loadable_measurements_data(load_batch: load_batch)

      expect(result.size).to eq(1)
      expect(result.first[:station_stream_id]).to eq(station_stream.id)
      expect(result.first[:value]).to eq(12.5)
    end

    it 'only matches station streams for EPA source' do
      other_source = create(:source, name: 'OTHER')
      create(
        :station_stream,
        external_ref: 'ABC123',
        stream_configuration: stream_configuration,
        source: other_source,
      )
      epa_stream =
        create(
          :station_stream,
          external_ref: 'ABC123',
          stream_configuration: stream_configuration,
          source: epa_source,
        )
      create(
        :epa_transformed_measurement,
        epa_staging_batch_id: batch.id,
        external_ref: 'ABC123',
      )

      result = subject.loadable_measurements_data(load_batch: load_batch)

      expect(result.size).to eq(1)
      expect(result.first[:station_stream_id]).to eq(epa_stream.id)
    end

    it 'returns empty array when no matches' do
      epa_source
      create(
        :epa_transformed_measurement,
        epa_staging_batch_id: batch.id,
        external_ref: 'NONEXISTENT',
      )

      result = subject.loadable_measurements_data(load_batch: load_batch)

      expect(result).to eq([])
    end
  end
end
