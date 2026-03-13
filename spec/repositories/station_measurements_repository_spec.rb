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
end
