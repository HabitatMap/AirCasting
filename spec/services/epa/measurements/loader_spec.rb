require 'rails_helper'

describe Epa::Measurements::Loader do
  subject { described_class.new }

  describe '#call' do
    it 'persists measurements, updates stream timestamps, and marks load batch as completed' do
      source = create(:source, name: 'EPA')
      stream_configuration =
        create(
          :stream_configuration,
          measurement_type: 'PM2.5',
          canonical: true,
        )
      cycle = create(:epa_ingest_cycle)
      staging_batch = create(:epa_staging_batch, status: 'completed', epa_ingest_cycle: cycle)
      load_batch = create(:epa_load_batch, epa_ingest_cycle: cycle, measurement_type: 'PM2.5')
      station_stream =
        create(
          :station_stream,
          external_ref: 'ABC123',
          stream_configuration: stream_configuration,
          source: source,
        )
      create(
        :epa_transformed_measurement,
        epa_staging_batch_id: staging_batch.id,
        external_ref: 'ABC123',
        measurement_type: 'PM2.5',
      )

      subject.call(load_batch_id: load_batch.id)

      expect(load_batch.reload.status).to eq('completed')
      expect(StationMeasurement.count).to eq(1)
      expect(station_stream.reload.last_measured_at).to be_present
    end

    it 'marks cycle as completed when it is the last load batch to complete' do
      create(:source, name: 'EPA')
      cycle = create(:epa_ingest_cycle, status: 'loading')
      load_batch = create(:epa_load_batch, epa_ingest_cycle: cycle, measurement_type: 'PM2.5')

      subject.call(load_batch_id: load_batch.id)

      expect(cycle.reload.status).to eq('completed')
    end

    it 'does not mark cycle as completed when other load batches are still pending' do
      create(:source, name: 'EPA')
      cycle = create(:epa_ingest_cycle, status: 'loading')
      load_batch = create(:epa_load_batch, epa_ingest_cycle: cycle, measurement_type: 'PM2.5')
      create(:epa_load_batch, epa_ingest_cycle: cycle, measurement_type: 'Ozone')

      subject.call(load_batch_id: load_batch.id)

      expect(cycle.reload.status).to eq('loading')
    end
  end
end
