require 'rails_helper'

RSpec.describe StationMeasurementsRepository do
  subject { described_class.new }

  describe '#last_2_days' do
    it 'returns measurements within 2 days of the latest measurement for the stream' do
      station_stream = create(:station_stream)

      latest = create(:station_measurement, station_stream: station_stream, measured_at: Time.parse('2025-01-15 09:00:00 UTC'), value: 1)
      within_1 = create(:station_measurement, station_stream: station_stream, measured_at: Time.parse('2025-01-14 10:00:00 UTC'), value: 2)
      # Exactly on the boundary (MAX - 2 days) → included
      boundary = create(:station_measurement, station_stream: station_stream, measured_at: Time.parse('2025-01-13 09:00:00 UTC'), value: 3)
      # One minute before boundary → excluded
      create(:station_measurement, station_stream: station_stream, measured_at: Time.parse('2025-01-13 08:59:00 UTC'), value: 99)

      result = subject.last_2_days(station_stream_id: station_stream.id)

      expect(result).to match_array([boundary, within_1, latest])
    end

    it 'does not return measurements belonging to a different stream' do
      config = create(:stream_configuration)
      stream_a = create(:station_stream, stream_configuration: config)
      stream_b = create(:station_stream, stream_configuration: config)

      create(:station_measurement, station_stream: stream_b, measured_at: Time.current, value: 50)
      own = create(:station_measurement, station_stream: stream_a, measured_at: Time.current, value: 10)

      result = subject.last_2_days(station_stream_id: stream_a.id)

      expect(result).to contain_exactly(own)
    end

    it 'returns results ordered by measured_at ascending' do
      station_stream = create(:station_stream)

      m3 = create(:station_measurement, station_stream: station_stream, measured_at: Time.parse('2025-01-15 09:00:00 UTC'), value: 3)
      m1 = create(:station_measurement, station_stream: station_stream, measured_at: Time.parse('2025-01-13 09:00:00 UTC'), value: 1)
      m2 = create(:station_measurement, station_stream: station_stream, measured_at: Time.parse('2025-01-14 10:00:00 UTC'), value: 2)

      result = subject.last_2_days(station_stream_id: station_stream.id)

      expect(result.to_a).to eq([m1, m2, m3])
    end

    it 'returns empty when the stream has no measurements' do
      station_stream = create(:station_stream)

      expect(subject.last_2_days(station_stream_id: station_stream.id)).to be_empty
    end
  end

  describe '#filter' do
    it 'returns measurements within the given time range for the stream' do
      station_stream = create(:station_stream)

      m1 = create(:station_measurement, station_stream: station_stream, measured_at: Time.zone.parse('2023-01-01T10:00:00Z'), value: 10.0)
      m2 = create(:station_measurement, station_stream: station_stream, measured_at: Time.zone.parse('2023-01-01T11:00:00Z'), value: 20.0)
      # Before range — excluded
      create(:station_measurement, station_stream: station_stream, measured_at: Time.zone.parse('2023-01-01T08:00:00Z'), value: 99.0)

      result = subject.filter(
        station_stream_id: station_stream.id,
        start_time: Time.zone.parse('2023-01-01T10:00:00Z'),
        end_time: Time.zone.parse('2023-01-01T11:00:00Z'),
      )

      expect(result).to match_array([m1, m2])
    end

    it 'does not return measurements belonging to a different stream' do
      config = create(:stream_configuration)
      stream_a = create(:station_stream, stream_configuration: config)
      stream_b = create(:station_stream, stream_configuration: config)
      t = Time.zone.parse('2023-01-01T10:00:00Z')

      create(:station_measurement, station_stream: stream_b, measured_at: t, value: 50.0)
      own = create(:station_measurement, station_stream: stream_a, measured_at: t, value: 10.0)

      result = subject.filter(
        station_stream_id: stream_a.id,
        start_time: t - 1.second,
        end_time: t + 1.second,
      )

      expect(result).to contain_exactly(own)
    end

    it 'returns results ordered by measured_at ascending' do
      station_stream = create(:station_stream)
      t = Time.zone.parse('2023-01-01T10:00:00Z')

      m2 = create(:station_measurement, station_stream: station_stream, measured_at: t + 1.hour, value: 2.0)
      m1 = create(:station_measurement, station_stream: station_stream, measured_at: t, value: 1.0)

      result = subject.filter(
        station_stream_id: station_stream.id,
        start_time: t - 1.second,
        end_time: t + 2.hours,
      )

      expect(result.to_a).to eq([m1, m2])
    end

    it 'returns empty when no measurements fall within the range' do
      station_stream = create(:station_stream)

      expect(
        subject.filter(
          station_stream_id: station_stream.id,
          start_time: Time.zone.parse('2023-01-01T10:00:00Z'),
          end_time: Time.zone.parse('2023-01-01T11:00:00Z'),
        ),
      ).to be_empty
    end
  end
end
