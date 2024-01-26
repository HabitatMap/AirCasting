require 'rails_helper'

describe MeasurementsRepository do
  subject { described_class.new }

  describe '#from_last_24_hours' do
    it 'returns measurements for given stream' do
      stream = create_stream!
      measurements = create_measurements!({ stream: stream, count: 10 })
      other_measurement = create_measurement!

      result = subject.from_last_24_hours(stream_id: stream.id)

      expect(result).to match_array(measurements)
    end

    it 'returns last 1440 measurements' do
      stream = create_stream!
      create_measurements!({ stream: stream, count: 1141 })

      result = subject.from_last_24_hours(stream_id: stream.id)

      expect(result.size).to eq(1140)
    end
  end
end
