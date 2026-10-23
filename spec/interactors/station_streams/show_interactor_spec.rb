require 'rails_helper'

RSpec.describe StationStreams::ShowInteractor do
  describe '#call' do
    it 'returns Success with the serialized stream' do
      station_stream = create(
        :station_stream,
        first_measured_at: 2.hours.ago,
        last_measured_at: 1.hour.ago,
      )

      result = subject.call(station_stream_id: station_stream.id)

      expect(result.success?).to be(true)
      expect(result.value[:stream][:session_id]).to eq(station_stream.id)
      expect(result.value[:stream][:active]).to be(true)
    end

    it 'returns Failure for an unknown id' do
      result = subject.call(station_stream_id: 0)

      expect(result.success?).to be(false)
      expect(result.errors).to eq(
        error_code: 'not_found',
        message: 'Station stream not found',
      )
    end

    it 'returns Failure for a stream that never reported' do
      station_stream = create(:station_stream, last_measured_at: nil)

      result = subject.call(station_stream_id: station_stream.id)

      expect(result.success?).to be(false)
      expect(result.errors).to eq(
        error_code: 'not_found',
        message: 'Station stream not found',
      )
    end
  end
end
