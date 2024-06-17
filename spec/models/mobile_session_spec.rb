require 'rails_helper'

describe MobileSession do
  let(:time_in_us) { Time.now.utc.in_time_zone('Eastern Time (US & Canada)') }

  describe '#local_time_range' do
    it 'should include sessions with start_time_local or end_time_local inside time range' do
      time = Time.now

      from = time.hour * 60 + time.min
      to = (time.hour + 1) * 60 + time.min

      session =
        FactoryBot.create(
          :mobile_session,
          start_time_local: time - 1.minute,
          end_time_local: time + 1.minute,
        )
      session1 =
        FactoryBot.create(
          :mobile_session,
          start_time_local: time - 2.minute,
          end_time_local: time - 1.minute,
        )
      session2 =
        FactoryBot.create(
          :mobile_session,
          start_time_local: time + 61.minute,
          end_time_local: time + 71.minute,
        )

      expect(MobileSession.local_minutes_range(from, to).to_a).to eq([session])
    end
  end

  describe '#as_json' do
    let(:stream) { FactoryBot.create(:stream) }
    let(:m1) { FactoryBot.create(:measurement, stream: stream) }
    let(:m1) { FactoryBot.create(:measurement, stream: stream) }
    let(:session) { FactoryBot.create(:mobile_session, streams: [stream]) }

    subject { session.as_json(methods: %i[measurements]) }

    it 'should tell streams to include measurements' do
      a = subject.symbolize_keys[:streams].first
      expected_response = {
        'average_value' => stream.average_value,
        'id' => stream.id,
        'max_latitude' => stream.max_latitude,
        'max_longitude' => stream.max_longitude,
        'measurement_short_type' => stream.measurement_short_type,
        'measurement_type' => stream.measurement_type,
        'measurements_count' => stream.measurements_count,
        'min_latitude' => stream.min_latitude,
        'min_longitude' => stream.min_longitude,
        'sensor_name' => stream.sensor_name,
        'sensor_package_name' => stream.sensor_package_name,
        'session_id' => stream.session_id,
        'size' => stream.size,
        'start_latitude' => stream.start_latitude,
        'start_longitude' => stream.start_longitude,
        'threshold_high' => stream.threshold_set.threshold_high,
        'threshold_low' => stream.threshold_set.threshold_low,
        'threshold_medium' => stream.threshold_set.threshold_medium,
        'threshold_very_high' => stream.threshold_set.threshold_very_high,
        'threshold_very_low' => stream.threshold_set.threshold_very_low,
        'unit_name' => stream.unit_name,
        'unit_symbol' => stream.unit_symbol,
        'threshold_set_id' => stream.threshold_set_id,
      }

      expect(a[1]).to eq(expected_response)
    end

    it 'should not provide own list of measurements' do
      expect(subject.symbolize_keys[:measurements]).to eq([])
    end
  end

  describe '.create' do
    let(:session) { FactoryBot.build(:mobile_session) }

    it 'should call set_url_token' do
      expect(session).to receive(:set_url_token)
      session.save
    end
  end

  describe '#destroy' do
    let(:stream) { FactoryBot.create(:stream) }
    let(:session) { FactoryBot.create(:mobile_session, streams: [stream]) }

    it 'should destroy streams' do
      session.reload.destroy

      expect(Stream.exists?(stream.id)).to be(false)
    end
  end

  describe '.filter_' do
    before { MobileSession.destroy_all }

    it 'should exclude not contributed sessions' do
      session1 = create_session_with_streams_and_measurements!
      session2 =
        create_session_with_streams_and_measurements!(contribute: false)

      expect(MobileSession.filter_.to_a).to eq([session1])
    end

    it '#filter includes sessions overlapping the time range' do
      now = Time.now
      plus_one_hour = (now + 1.hour)
      plus_two_hours = (now + 2.hours)
      session =
        create_session_with_streams_and_measurements!(
          start_time_local: now,
          end_time_local: now + 3.hours,
        )

      actual =
        MobileSession.filter_(time_from: plus_one_hour, time_to: plus_two_hours)
          .to_a

      expect(actual).to eq([session])
    end

    it '#filter excludes sessions outside the time range' do
      now = Time.now
      plus_one_hour = (now + 1.hour)
      plus_two_hours = (now + 2.hours)
      session =
        FactoryBot.create(
          :mobile_session,
          start_time_local: now,
          end_time_local: now + 1.second,
        )

      actual =
        MobileSession.filter_(time_from: plus_one_hour, time_to: plus_two_hours)
          .to_a

      expect(actual).to eq([])
    end

    it 'should find sessions by usernames' do
      user_1 = create_user!(username: 'foo bar')
      user_2 = create_user!(username: 'john')
      session_1 = create_session_with_streams_and_measurements!(user: user_1)
      session_2 = create_session_with_streams_and_measurements!(user: user_2)

      expect(MobileSession.filter_(usernames: 'foo bar, biz').to_a).to eq(
        [session_1],
      )
    end
  end

  describe '#set_url_token' do
    let(:token) { 'abc123' }
    let(:gen) { double(generate_unique: token) }

    before do
      allow(TokenGenerator).to receive_messages(new: gen)
      subject.send(:set_url_token)
    end

    it 'sets url_token to one generated by TokenGenerator' do
      expect(subject.url_token).to eq(token)
    end
  end

  describe '#to_param' do
    let(:session) { MobileSession.new }

    subject { session.to_param }

    it { is_expected.to eq(session.url_token) }
  end

  describe '#sync' do
    let(:session) { FactoryBot.create(:mobile_session) }
    let!(:note) { FactoryBot.create(:note, session: session) }
    let(:data) { { tag_list: 'some tag or other', notes: [] } }

    before { session.reload.sync(data) }

    it 'should normalize tags' do
      expect(session.reload.tags.count).to eq(4)
    end

    it 'should delete notes' do
      expect(Note.exists?(note.id)).to be(false)
    end
  end

  describe '#start_time_local' do
    it 'keeps local time info' do
      session = FactoryBot.build(:mobile_session)
      session.start_time_local = time_in_us

      session.save
      session.reload
      expect(session.start_time_local.strftime('%FT%T')).to eq(
        time_in_us.strftime('%FT%T'),
      )
    end
  end

  describe '#end_time_local' do
    it 'keeps local time info' do
      session = FactoryBot.build(:mobile_session)
      session.end_time_local = time_in_us
      session.save
      session.reload
      expect(session.end_time_local.strftime('%FT%T')).to eq(
        time_in_us.strftime('%FT%T'),
      )
    end
  end
end
