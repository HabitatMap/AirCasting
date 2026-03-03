require 'rails_helper'

describe Eea::Measurements::Loader do
  subject { described_class.new }

  describe '#call' do
    it 'persists measurements, updates stream timestamps, marks batch as saved, and enqueues cleanup' do
      allow(Eea::CleanupBatchWorker).to receive(:perform_async)
      source = create(:source, name: 'EEA')
      stream_configuration =
        create(
          :stream_configuration,
          measurement_type: 'PM2.5',
          canonical: true,
        )
      batch = create(:eea_ingest_batch)
      station_stream =
        create(
          :station_stream,
          external_ref: 'SPO.PL0003A',
          stream_configuration: stream_configuration,
          source: source,
          last_measured_at: nil,
        )
      create(
        :eea_transformed_measurement,
        eea_ingest_batch_id: batch.id,
        external_ref: 'SPO.PL0003A',
        measurement_type: 'PM2.5',
      )

      subject.call(batch_id: batch.id)

      expect(batch.reload.status).to eq('saved')
      expect(StationMeasurement.count).to eq(1)
      expect(station_stream.reload.last_measured_at).to be_present
      expect(Eea::CleanupBatchWorker).to have_received(:perform_async).with(
        batch.id,
      )
    end
  end
end
