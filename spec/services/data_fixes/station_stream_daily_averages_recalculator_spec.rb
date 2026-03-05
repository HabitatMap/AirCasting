require 'rails_helper'

RSpec.describe DataFixes::StationStreamDailyAveragesRecalculator do
  subject { described_class.new }

  let!(:eea_source) { create(:source, name: 'EEA') }
  let!(:stream_configuration) { create(:stream_configuration) }

  describe '#call' do
    context 'when there are station streams with measurements' do
      it 'creates a daily average with the correct value and date' do
        stream =
          create(
            :station_stream,
            source: eea_source,
            time_zone: 'UTC',
            stream_configuration: stream_configuration,
          )
        create(
          :station_measurement,
          station_stream: stream,
          measured_at: Time.parse('2025-01-15 10:00:00 UTC'),
          value: 10,
        )
        create(
          :station_measurement,
          station_stream: stream,
          measured_at: Time.parse('2025-01-15 14:00:00 UTC'),
          value: 20,
        )

        result = subject.call(source_name: :eea)

        avg = StationStreamDailyAverage.find_by(station_stream: stream)
        expect(avg.value).to eq(15)
        expect(avg.date).to eq(Date.new(2025, 1, 15))
        expect(result[:processed]).to eq(1)
        expect(result[:errors]).to be_empty
      end
    end

    context 'when station streams from other sources exist' do
      it 'only processes streams for the given source' do
        other_source = create(:source, name: 'EPA')
        eea_stream =
          create(
            :station_stream,
            source: eea_source,
            time_zone: 'UTC',
            stream_configuration: stream_configuration,
          )
        other_stream =
          create(
            :station_stream,
            source: other_source,
            time_zone: 'UTC',
            stream_configuration: stream_configuration,
          )
        create(
          :station_measurement,
          station_stream: eea_stream,
          measured_at: Time.parse('2025-01-15 12:00:00 UTC'),
          value: 10,
        )
        create(
          :station_measurement,
          station_stream: other_stream,
          measured_at: Time.parse('2025-01-15 12:00:00 UTC'),
          value: 99,
        )

        subject.call(source_name: :eea)

        expect(StationStreamDailyAverage.count).to eq(1)
        expect(StationStreamDailyAverage.first.station_stream_id).to eq(
          eea_stream.id,
        )
      end
    end
  end
end
