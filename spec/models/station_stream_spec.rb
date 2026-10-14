require 'rails_helper'

describe StationStream do
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
