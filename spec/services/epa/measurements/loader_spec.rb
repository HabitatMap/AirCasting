require 'rails_helper'

describe Epa::Measurements::Loader do
  subject { described_class.new }

  describe '#call' do
    it 'persists measurements, updates stream timestamps, and marks batch as saved' do
      source = create(:source, name: 'EPA')
      stream_configuration =
        create(
          :stream_configuration,
          measurement_type: 'PM2.5',
          canonical: true,
        )
      batch = create(:epa_ingest_batch, status: 'transformed')
      station_stream =
        create(
          :station_stream,
          external_ref: 'ABC123',
          stream_configuration: stream_configuration,
          source: source,
        )
      create(
        :epa_transformed_measurement,
        epa_ingest_batch_id: batch.id,
        external_ref: 'ABC123',
      )

      subject.call(batch_id: batch.id)

      expect(batch.reload.status).to eq('saved')
      expect(StationMeasurement.count).to eq(1)
      expect(station_stream.reload.last_measured_at).to be_present
    end
  end
end
