require 'rails_helper'

describe SessionsRepository do
  subject { described_class.new }

  describe '#filter_by_sensor_package_name_and_datetime' do
    it 'returns all streams with the given sensor package name' do
      session_1 = create(:mobile_session, start_time_local: '2025-01-15T09:00')
      session_2 = create(:mobile_session, start_time_local: '2025-01-15T09:00')
      session_3 = create(:mobile_session, start_time_local: '2025-01-20T09:00')

      create(:stream, session: session_1, sensor_package_name: 'AirBeam3:123')
      create(:stream, session: session_2, sensor_package_name: 'AirBeam3:456')
      create(:stream, session: session_3, sensor_package_name: 'AirBeam3:123')

      result =
        subject.filter_by_sensor_package_name_and_datetime(
          sensor_package_name: 'AirBeam3:123',
          start_datetime: '2025-01-15T00:00',
          end_datetime: '2025-01-16T00:00',
        )

      expect(result).to contain_exactly(session_1)
      expect(result.first.association(:streams).loaded?).to eq(true)
    end
  end
end
