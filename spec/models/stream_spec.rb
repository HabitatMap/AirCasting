require 'rails_helper'

describe Stream do
  describe '#build_measurements!' do
    it 'with valid data it imports the measurements' do
      stream = FactoryBot.create(:stream)
      data =
        [1, 2, 3].sample.times.map { FactoryBot.attributes_for(:measurement) }

      expect { stream.build_measurements!(data) }.to change {
          Measurement.count
        }
        .from(0)
        .to(data.size)
    end

    it 'skips invalid measurements' do
      stream = FactoryBot.create(:stream)
      valid_data =
        [1, 2, 3].sample.times.map { FactoryBot.attributes_for(:measurement) }
      invalid_data =
        valid_data.map do |params|
          required_fields = %i[value longitude latitude time]
          invalid_params = required_fields.map { |field| { field => nil } }
          params.merge(invalid_params.sample)
        end
      data = (valid_data + invalid_data).shuffle

      expect { stream.build_measurements!(data) }.to change {
          Measurement.count
        }
        .from(0)
        .to(valid_data.size)
    end

    it 'with valid data it updates Stream#measurements_count' do
      stream = FactoryBot.create(:stream)
      data =
        [1, 2, 3].sample.times.map { FactoryBot.attributes_for(:measurement) }

      expect { stream.build_measurements!(data) }.to change {
          stream.reload.measurements_count
        }
        .from(0)
        .to(data.size)
    end

    # Rehearses the world after the partial unique index on (stream_id, time)
    # lands. This path has no reject_existing, so ON CONFLICT is what actually
    # fires here: without on_duplicate_key_ignore a single resent row raises
    # RecordNotUnique and takes the whole multi-row INSERT with it.
    context 'once (stream_id, time) is unique' do
      # No teardown: DDL is transactional in Postgres and use_transactional_fixtures
      # rolls the index back with the example. Dropping it explicitly would run
      # inside an already-aborted transaction whenever an example fails on a
      # constraint, leaving the index behind for every example after it.
      before do
        ActiveRecord::Base.connection.execute(
          'CREATE UNIQUE INDEX tmp_uniq_measurements_stream_time ON measurements (stream_id, time)',
        )
      end

      def measurement_at(seconds)
        FactoryBot.attributes_for(
          :measurement,
          time: Time.utc(2026, 8, 14, 10, 0, seconds),
          time_with_time_zone: Time.utc(2026, 8, 14, 10, 0, seconds),
        )
      end

      it 'ignores a full resend instead of aborting the batch' do
        stream = FactoryBot.create(:stream)
        data = [measurement_at(0), measurement_at(1)]
        stream.build_measurements!(data)

        expect { stream.build_measurements!(data) }.not_to change { Measurement.count }
        expect(stream.reload.measurements_count).to eq(2)
      end

      it 'counts only the rows that landed when a batch mixes resent and new' do
        stream = FactoryBot.create(:stream)
        stream.build_measurements!([measurement_at(0), measurement_at(1)])

        expect { stream.build_measurements!([measurement_at(1), measurement_at(2)]) }
          .to change { Measurement.count }.by(1)
        expect(stream.reload.measurements_count).to eq(3)
      end

      it 'deduplicates within a single batch' do
        stream = FactoryBot.create(:stream)

        stream.build_measurements!([measurement_at(0), measurement_at(0), measurement_at(1)])

        expect(Measurement.count).to eq(2)
        expect(stream.reload.measurements_count).to eq(2)
      end
    end
  end

  describe '.as_json' do
    it 'should include stream size and measurements' do
      stream = FactoryBot.create(:stream)

      actual = stream.as_json(methods: %i[measurements])

      expect(actual['size']).not_to be_nil
      expect(actual['measurements']).not_to be_nil
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
            Stream.with_usernames([user.username, user2.username]),
          ).to include stream, stream2
        end
      end
    end

    describe '#mobile' do
      it 'returns only mobile streams' do
        mobile_session = create_mobile_session!
        mobile_stream = create_stream!(session: mobile_session)
        fixed_session = create_fixed_session!
        create_stream!(session: fixed_session)

        expect(Stream.mobile).to contain_exactly(mobile_stream)
      end
    end
  end

  describe '#fixed?' do
    it 'with a fixed stream it returns true' do
      fixed_stream = create_stream!(session: create_fixed_session!)

      expect(fixed_stream.fixed?).to eq(true)
    end

    it 'with a mobile stream it returns false' do
      mobile_stream = create_stream!(session: create_mobile_session!)

      expect(mobile_stream.fixed?).to eq(false)
    end
  end
end
