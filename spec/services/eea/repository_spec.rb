require 'rails_helper'

describe Eea::Repository do
  subject { described_class.new }

  describe '#find_ingest_batch!' do
    it 'returns the batch with given id' do
      batch = create(:eea_ingest_batch)

      result = subject.find_ingest_batch!(batch_id: batch.id)

      expect(result).to eq(batch)
    end
  end

  describe '#update_ingest_batch_status!' do
    it 'updates the batch status' do
      batch = create(:eea_ingest_batch, status: 'transformed')

      subject.update_ingest_batch_status!(batch: batch, status: :saved)

      expect(batch.reload.status).to eq('saved')
    end
  end

  describe '#loadable_measurements_data' do
    it 'returns measurements matched to station streams' do
      eea_source = create(:source, name: 'EEA')
      batch = create(:eea_ingest_batch)
      stream_configuration = create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
      station_stream =
        create(
          :station_stream,
          external_ref: 'SPO.PL0003A',
          stream_configuration: stream_configuration,
          source: eea_source,
        )
      create(
        :eea_transformed_measurement,
        eea_ingest_batch_id: batch.id,
        external_ref: 'SPO.PL0003A',
        measurement_type: 'PM2.5',
        measured_at: Time.zone.parse('2026-02-24 10:00:00'),
        value: 10.0,
      )

      result = subject.loadable_measurements_data(batch_id: batch.id)

      expect(result.size).to eq(1)
      expect(result.first[:station_stream_id]).to eq(station_stream.id)
      expect(result.first[:value]).to eq(10.0)
      expect(result.first[:measured_at]).to eq(Time.parse('2026-02-24 10:00:00'))
    end

    it 'only matches station streams for EEA source' do
      eea_source = create(:source, name: 'EEA')
      other_source = create(:source, name: 'OTHER')
      batch = create(:eea_ingest_batch)
      stream_configuration = create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
      create(
        :station_stream,
        external_ref: 'SPO.PL0003A',
        stream_configuration: stream_configuration,
        source: other_source,
      )
      eea_stream =
        create(
          :station_stream,
          external_ref: 'SPO.PL0003A',
          stream_configuration: stream_configuration,
          source: eea_source,
        )
      create(
        :eea_transformed_measurement,
        eea_ingest_batch_id: batch.id,
        external_ref: 'SPO.PL0003A',
        measurement_type: 'PM2.5',
      )

      result = subject.loadable_measurements_data(batch_id: batch.id)

      expect(result.size).to eq(1)
      expect(result.first[:station_stream_id]).to eq(eea_stream.id)
    end

    it 'only returns measurements for the given batch' do
      eea_source = create(:source, name: 'EEA')
      batch = create(:eea_ingest_batch)
      other_batch =
        create(
          :eea_ingest_batch,
          window_starts_at: 2.days.ago.beginning_of_hour - 6.hours,
          window_ends_at: 2.days.ago.beginning_of_hour,
        )
      stream_configuration = create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
      create(
        :station_stream,
        external_ref: 'SPO.PL0003A',
        stream_configuration: stream_configuration,
        source: eea_source,
      )
      create(
        :eea_transformed_measurement,
        eea_ingest_batch_id: other_batch.id,
        external_ref: 'SPO.PL0003A',
        measurement_type: 'PM2.5',
      )

      result = subject.loadable_measurements_data(batch_id: batch.id)

      expect(result).to eq([])
    end

    it 'returns empty array when no matching station streams exist' do
      create(:source, name: 'EEA')
      batch = create(:eea_ingest_batch)
      create(
        :eea_transformed_measurement,
        eea_ingest_batch_id: batch.id,
        external_ref: 'UNKNOWN_REF',
      )

      result = subject.loadable_measurements_data(batch_id: batch.id)

      expect(result).to eq([])
    end
  end
end
