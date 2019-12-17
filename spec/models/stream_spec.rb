require 'rails_helper'

describe Stream do
  let(:stream) { FactoryBot.create(:stream) }
  let!(:measurement) { FactoryBot.create(:measurement, stream: stream) }

  describe '#build_measurements!' do
    let(:measurement_data) { double('measurement data') }

    before do
      expect(Measurement).to receive(:new).with(measurement_data).and_return(
        measurement
      )
      expect(measurement).to receive(:stream=).with(any_args) { |x|
        x.id == stream.id
      }
      expect(Measurement).to receive(:import).with(any_args) do |measurements|
        expect(measurements).to include measurement
        import_result
      end
    end

    context 'the measurements are valid' do
      let(:import_result) { double(failed_instances: []) }

      it 'should import the measurements' do
        expect(Stream).to receive(:update_counters).with(
          stream.id,
          measurements_count: 1
        )

        stream.build_measurements!([measurement_data])
      end
    end

    context 'the measurements are invalid' do
      let(:import_result) { double(failed_instances: [1, 2, 3]) }

      it 'should cause an error' do
        expect {
          stream.build_measurements!([measurement_data])
        }.to raise_error(
          'Measurement import failed! Failed instances: [1, 2, 3]'
        )
      end
    end
  end

  describe '#destroy' do
    it 'should destroy measurements' do
      stream.reload.destroy

      expect(Measurement.exists?(measurement.id)).to be(false)
    end
  end

  describe '.as_json' do
    subject { stream.as_json(methods: %i[measurements]) }

    it 'should include stream size and measurements' do
      expect(subject['size']).not_to be_nil
      expect(subject['measurements']).not_to be_nil
    end
  end

  describe 'scope' do
    let(:user) { FactoryBot.create(:user) }
    let(:user2) { FactoryBot.create(:user) }
    let(:session) { FactoryBot.create(:mobile_session, user: user) }
    let(:session2) { FactoryBot.create(:mobile_session, user: user2) }
    let(:stream) do
      FactoryBot.create(:stream, sensor_name: 'Sensor1', session: session)
    end
    let(:stream2) do
      FactoryBot.create(:stream, sensor_name: 'Sensor2', session: session2)
    end

    describe '#with_sensor' do
      it 'returns sensor with specified name' do
        streams = Stream.with_sensor(stream.sensor_name)
        expect(streams).to include stream
        expect(streams).not_to include stream2
      end
    end

    describe '#with_usernames' do
      context 'no user names' do
        it 'returns all streams' do
          expect(Stream.with_usernames([])).to include stream, stream2
        end
      end

      context 'one user name' do
        it 'returns on streams with that user associated' do
          streams = Stream.with_usernames([user.username])
          expect(streams).to include stream
          expect(streams).not_to include stream2
        end
      end

      context 'multiple user names' do
        it 'returns all streams with those usernames' do
          expect(
            Stream.with_usernames([user.username, user2.username])
          ).to include stream, stream2
        end
      end
    end
  end
end
