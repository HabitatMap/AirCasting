require 'rails_helper'

describe SessionsRepository do
  subject { described_class.new }

  # Both readers below are fixed-only by intent and were fixed-only by accident:
  # mobile last_measurement_at is NULL, and NULL fails every comparison. Once the
  # column is populated for mobile sessions the accident stops holding, so the
  # type filter is the thing under test.
  describe '#active_in_last_7_days' do
    it 'returns fixed sessions measured within the last 7 days' do
      recent = create(:fixed_session, last_measurement_at: 2.days.ago)
      _stale = create(:fixed_session, last_measurement_at: 8.days.ago)
      _never = create(:fixed_session, last_measurement_at: nil)

      expect(subject.active_in_last_7_days).to contain_exactly(recent)
    end

    # Feeds Timelapse::ClustersCreator, which builds clusters for the fixed map.
    it 'excludes mobile sessions measured within the last 7 days' do
      create(:mobile_session, last_measurement_at: 2.days.ago)

      expect(subject.active_in_last_7_days).to be_empty
    end
  end

  describe '#fixed_active_government_sessions' do
    def query(sensor_name: 'airbeam-pm2.5')
      subject.fixed_active_government_sessions(
        sensor_name: sensor_name,
        west: 0,
        east: 20,
        north: 60,
        south: 0,
      ).to_a
    end

    def session_with_stream(factory, **attributes)
      session = create(factory, latitude: 10, longitude: 10, **attributes)
      create(:stream, session: session, sensor_name: 'AirBeam-PM2.5')
      session
    end

    it 'returns fixed sessions measured in the last 24 hours inside the bounding box' do
      recent = session_with_stream(:fixed_session, last_measurement_at: 1.hour.ago)
      session_with_stream(:fixed_session, last_measurement_at: 2.days.ago)

      expect(query.map { |row| row['uuid'] }).to eq([recent.uuid])
    end

    it 'excludes mobile sessions measured in the last 24 hours' do
      session_with_stream(:mobile_session, last_measurement_at: 1.hour.ago)

      expect(query).to be_empty
    end
  end

  describe '#filter' do
    it 'returns sessions filtered by tags, sensor_package_name, and date range' do
      session_1 =
        create(
          :mobile_session,
          start_time_local: '2025-01-15T09:00',
          tag_list: %w[tag1 tag2],
        )
      session_2 =
        create(
          :mobile_session,
          start_time_local: '2025-01-15T10:00',
          tag_list: 'tag3',
        )
      session_3 =
        create(
          :mobile_session,
          start_time_local: '2025-01-20T09:00',
          tag_list: 'tag1',
        )
      stream_1 =
        create(:stream, session: session_1, sensor_package_name: 'AirBeam3:123')
      stream_2 =
        create(:stream, session: session_2, sensor_package_name: 'AirBeam3:456')
      stream_3 =
        create(:stream, session: session_3, sensor_package_name: 'AirBeam3:123')

      params = {
        start_datetime: '2025-01-15T00:00',
        end_datetime: '2025-01-16T00:00',
        tags: %w[tag1 tag2],
        sensor_package_name: 'AirBeam3:123',
      }
      result = subject.filter(params: params)

      expect(result).to contain_exactly(session_1)
      expect(result.first.association(:streams).loaded?).to eq(true)
    end

    it 'returns sessions filtered only by tags' do
      session_1 = create(:mobile_session, tag_list: %w[tag1 tag2])
      session_2 = create(:mobile_session, tag_list: 'tag1')
      stream_1 = create(:stream, session: session_1)
      stream_2 = create(:stream, session: session_2)

      _another_session = create(:mobile_session, tag_list: 'other_tag')
      _another_stream = create(:stream, session: _another_session)

      result = subject.filter(params: { tags: %w[tag1 tag2] })

      expect(result).to match_array([session_1, session_2])
    end

    it 'returns sessions filtered only by sensor_package_name' do
      session_1 = create(:mobile_session)
      session_2 = create(:mobile_session)
      stream_1 =
        create(:stream, session: session_1, sensor_package_name: 'AirBeam3:123')
      stream_2 =
        create(:stream, session: session_2, sensor_package_name: 'AirBeam3:123')
      _another_session = create(:mobile_session)
      _another_stream =
        create(
          :stream,
          session: _another_session,
          sensor_package_name: 'AirBeam3:456',
        )

      result = subject.filter(params: { sensor_package_name: 'AirBeam3:123' })

      expect(result).to match_array([session_1, session_2])
    end

    it 'returns sessions filtered only by date range' do
      session_1 = create(:mobile_session, start_time_local: '2025-01-15T09:00')
      session_2 = create(:mobile_session, start_time_local: '2025-01-18T09:00')
      stream_1 = create(:stream, session: session_1)
      stream_2 = create(:stream, session: session_2)
      _another_session =
        create(:mobile_session, start_time_local: '2025-01-21T09:00')
      _another_stream = create(:stream, session: _another_session)

      params = {
        start_datetime: '2025-01-15T00:00',
        end_datetime: '2025-01-20T00:00',
      }
      result = subject.filter(params: params)

      expect(result).to match_array([session_1, session_2])
    end
  end
end
