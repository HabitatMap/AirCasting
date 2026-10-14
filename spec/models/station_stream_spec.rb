require 'rails_helper'

describe StationStream do
  describe '.shown' do
    it 'returns streams on shown stations and streams without a station' do
      stream_configuration = create(:stream_configuration)
      on_shown_station =
        create(:station_stream, stream_configuration: stream_configuration, station: create(:station))
      without_station =
        create(:station_stream, stream_configuration: stream_configuration, station: nil)
      create(
        :station_stream,
        stream_configuration: stream_configuration,
        station: create(:station, excluded_reason: Station::EXCLUDED_REASONS[:temporary]),
      )
      create(
        :station_stream,
        stream_configuration: stream_configuration,
        station: create(:station, excluded_reason: Station::EXCLUDED_REASONS[:no_coordinates]),
      )

      expect(described_class.shown).to contain_exactly(on_shown_station, without_station)
    end
  end

  describe '#is_active' do
    it 'is true when the stream reported within ACTIVE_FOR' do
      stream = build(:station_stream, last_measured_at: 1.hour.ago)

      expect(stream.is_active).to be(true)
    end

    it 'is false when the stream last reported before ACTIVE_FOR' do
      stream = build(:station_stream, last_measured_at: 25.hours.ago)

      expect(stream.is_active).to be(false)
    end

    it 'is false when the stream never reported' do
      stream = build(:station_stream, last_measured_at: nil)

      expect(stream.is_active).to be(false)
    end
  end
end
