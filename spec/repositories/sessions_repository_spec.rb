require 'rails_helper'

describe SessionsRepository do
  subject { described_class.new }

  describe '#filter' do
    it 'returns sessions filtered by tags, sensor_package_name, and date range' do
      session_1 =
        create(
          :mobile_session,
          start_time_local: '2025-01-15T09:00',
          tag_list: 'tag1,tag2',
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
        tags: 'tag1,tag2',
        sensor_package_name: 'AirBeam3:123',
      }
      result = subject.filter(params: params)

      expect(result).to contain_exactly(session_1)
      expect(result.first.association(:streams).loaded?).to eq(true)
    end

    it 'returns sessions filtered only by tags' do
      session_1 = create(:mobile_session, tag_list: 'tag1,tag2')
      session_2 = create(:mobile_session, tag_list: 'tag1')
      stream_1 = create(:stream, session: session_1)
      stream_2 = create(:stream, session: session_2)

      _another_session = create(:mobile_session, tag_list: 'other_tag')
      _another_stream = create(:stream, session: _another_session)

      result = subject.filter(params: { tags: 'tag1,tag2' })

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
