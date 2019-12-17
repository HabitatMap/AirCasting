require 'rails_helper'

describe Measurement do
  describe 'scopes' do
    let(:session) { FactoryBot.create(:mobile_session) }
    let(:stream) { FactoryBot.create(:stream, session: session) }
    let(:stream2) { FactoryBot.create(:stream, session: session) }
    let(:measurement) { FactoryBot.create(:measurement, stream: stream) }
    let(:measurement2) { FactoryBot.create(:measurement, stream: stream2) }

    describe '#with_tags' do
      it 'returns all measurements belonging to stream id after since_date ordered by time' do
        now = DateTime.current
        stream = create_stream!(session: create_session!)
        measurement1 = create_measurement!(stream: stream, time: now)
        measurement2 =
          create_measurement!(stream: stream, time: now + 20.seconds)
        measurement3 =
          create_measurement!(stream: stream, time: now + 10.seconds)

        actual =
          Measurement.since(stream_id: stream.id, since_date: now + 5.seconds)

        expect(actual).to eq([measurement3, measurement2])
      end
    end

    describe '#with_tags' do
      context 'no tags' do
        it 'returns all measurements' do
          expect(Measurement.with_tags([])).to include measurement, measurement2
        end
      end

      context 'multiple tags' do
        it 'returns measurements in stream sessions that have associated tags' do
          expect(
            Measurement.with_tags(%w[quiet boring])
          ).to include measurement, measurement2
        end
      end
    end

    describe '#with_streams' do
      context 'no stream ids' do
        it 'returns no measurements' do
          expect(Measurement.with_streams([]).blank?).to be(true)
        end
      end

      context 'one stream id' do
        it 'returns only measurements in that stream' do
          measurements = Measurement.with_streams([stream.id])
          expect(measurements).to include measurement
          expect(measurements).not_to include measurement2
        end
      end

      context 'multiple stream ids' do
        it 'returns measurements in those streams' do
          expect(
            Measurement.with_streams([stream.id, stream2.id])
          ).to include measurement, measurement2
        end
      end
    end

    describe '#in_rectangle' do
      let(:measurement) do
        FactoryBot.create(:measurement, longitude: 0, latitude: 0)
      end

      it 'does not return measurement not in range' do
        data = { north: 10, south: 5, east: 10, west: 5 }
        expect(Measurement.in_rectangle(data)).not_to include measurement
      end

      it 'returns measurement in range' do
        data = { north: 10, south: -10, east: 10, west: -10 }
        expect(Measurement.in_rectangle(data)).to include measurement
      end
    end

    describe '#with_time' do
      it 'returns measurements that are in the range' do
        measurement = create_measurement!(time: Time.new(2_010, 1, 2))

        data = {
          time_from: Time.new(2_010, 1, 1).to_i,
          time_to: Time.new(2_010, 1, 3).to_i
        }

        expect(Measurement.with_time(data)).to include measurement
      end

      it 'does not return measurements that are not in the range' do
        measurement = create_measurement!(time: Time.new(2_010, 1, 1))

        data = {
          time_from: Time.new(2_010, 1, 2).to_i,
          time_to: Time.new(2_010, 1, 3).to_i
        }

        expect(Measurement.with_time(data)).not_to include measurement
      end

      it 'does not return measurements that are not in the minutes range even when they are in the date range' do
        measurement = create_measurement!(time: Time.new(2_010, 1, 2, 1, 1))

        data = {
          time_from: Time.new(2_010, 1, 1, 1, 3).to_i,
          time_to: Time.new(2_010, 1, 3, 1, 4).to_i
        }

        expect(Measurement.with_time(data)).not_to include measurement
      end
    end

    describe '#with_time2' do
      it 'returns measurements that are in the range' do
        measurement = create_measurement!(time: Time.new(2_010, 1, 2))

        data = {
          time_from: Time.new(2_010, 1, 1).to_i,
          time_to: Time.new(2_010, 1, 3).to_i
        }

        expect(Measurement.with_time2(data)).to include measurement
      end

      it 'returns measurements on the date boundaries' do
        measurement = create_measurement!(time: Time.new(2_010, 1, 1))
        measurement2 = create_measurement!(time: Time.new(2_010, 1, 3))

        data = {
          time_from: Time.new(2_010, 1, 1).to_i,
          time_to: Time.new(2_010, 1, 3).to_i
        }

        expect(Measurement.with_time2(data)).to include measurement,
                measurement2
      end

      it 'does not return measurements outside time boundaries' do
        measurement = create_measurement!(time: Time.new(2_010, 1, 1, 1, 3))

        data = {
          time_from: Time.new(2_010, 1, 1, 1, 1).to_i,
          time_to: Time.new(2_010, 1, 1, 1, 2).to_i
        }

        expect(Measurement.with_time2(data)).not_to include measurement
      end

      it 'does not return measurements that are not in the range' do
        measurement = create_measurement!(time: Time.new(2_010, 1, 1))

        data = {
          time_from: Time.new(2_010, 1, 2).to_i,
          time_to: Time.new(2_010, 1, 3).to_i
        }

        expect(Measurement.with_time2(data)).not_to include measurement
      end

      it 'returns measurements that are not in the time range but they are in the date range' do
        measurement = create_measurement!(time: Time.new(2_010, 1, 2, 1, 1))

        data = {
          time_from: Time.new(2_010, 1, 1, 1, 3).to_i,
          time_to: Time.new(2_010, 1, 3, 1, 4).to_i
        }

        expect(Measurement.with_time2(data)).to include measurement
      end
    end

    describe '#belonging_to_sessions_with_ids' do
      it 'returns measurements belonging to the sessions with the passed ids' do
        session1 = create_session!
        session2 = create_session!
        stream1 = create_stream!(session: session1)
        stream2 = create_stream!(session: session2)
        create_measurement!(stream: stream1)
        measurement2 = create_measurement!(stream: stream2)
        measurement3 = create_measurement!(stream: stream2)

        actual = Measurement.belonging_to_sessions_with_ids([session2.id])

        expect(actual).to match_array([measurement2, measurement3])
      end
    end
  end
end
