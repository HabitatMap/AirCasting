require 'rails_helper'

RSpec.describe FixedPolling::Repository do
  subject { described_class.new }

  describe '#session' do
    it 'returns the session with loaded assocations' do
      session = create(:fixed_session, uuid: 'test-uuid')
      stream = create(:stream, session: session)

      result = subject.session(uuid: 'test-uuid')

      expect(result).to eq(session)
      expect(result.association(:streams)).to be_loaded
      expect(result.streams.first.association(:threshold_set)).to be_loaded
    end
  end

  describe '#measurements_grouped_by_stream_ids' do
    context 'measurements for given streams and time range exist' do
      it 'returns measurements grouped by stream_id' do
        stream_1 = create(:stream)
        stream_2 = create(:stream)
        measurement_1_1 =
          create(:measurement, stream: stream_1, time: 2.hours.ago)
        measurement_1_2 =
          create(:measurement, stream: stream_1, time: 1.hour.ago)
        measurement_2_1 =
          create(:measurement, stream: stream_2, time: 4.hours.ago)
        measurement_2_2 =
          create(:measurement, stream: stream_2, time: 1.hour.ago)
        _other_measurement = create(:measurement, time: 1.hour.ago)

        result =
          subject.measurements_grouped_by_stream_ids(
            stream_ids: [stream_1.id, stream_2.id],
            since: 3.hours.ago,
          )

        expect(result.keys).to match_array([stream_1.id, stream_2.id])
        expect(result[stream_1.id]).to match_array(
          [measurement_1_1, measurement_1_2],
        )
        expect(result[stream_2.id]).to match_array([measurement_2_2])
      end
    end
    context 'measurements for given streams and time range do not exist' do
      it 'returns an empty hash' do
        stream = create(:stream)
        result =
          subject.measurements_grouped_by_stream_ids(
            stream_ids: [stream],
            since: 10.minutes.ago,
          )

        expect(result).to eq({})
      end
    end
  end
end
