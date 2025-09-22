require 'rails_helper'

RSpec.describe AirNowStreaming::StreamsCreator do
  subject { described_class.new }

  describe '#call' do
    it 'creates sessions, streams, and fixed measurements' do
      create(:user, username: 'US EPA AirNow')
      create(:threshold_set, sensor_name: 'Government-PM2.5')
      create(:threshold_set, sensor_name: 'Government-NO2')

      sessions_data = {
        {
          latitude: 46.386,
          longitude: -62.583,
          sensor_name: 'Government-PM2.5',
        } => [
          {
            time: Time.zone.parse('2025-07-24T07:00:00'),
            time_with_time_zone: Time.zone.parse('2025-07-24T10:00:00'),
            time_zone: 'America/Halifax',
            title: 'SOUTHAMPTON',
            value: 5.3,
          },
        ],
        {
          latitude: 44.647,
          longitude: -63.574,
          sensor_name: 'Government-NO2',
        } => [
          {
            time: Time.zone.parse('2025-07-24T07:00:00'),
            time_with_time_zone: Time.zone.parse('2025-07-24T10:00:00'),
            time_zone: 'America/Halifax',
            title: 'JOHNSTON BUILDING',
            value: 4.2,
          },
          {
            time: Time.zone.parse('2025-07-24T08:00:00'),
            time_with_time_zone: Time.zone.parse('2025-07-24T11:00:00'),
            time_zone: 'America/Halifax',
            title: 'JOHNSTON BUILDING',
            value: 5.2,
          },
        ],
      }

      expect { subject.call(sessions_data: sessions_data) }.to change(
        Session,
        :count,
      ).by(2).and change(Stream, :count).by(2).and change(
                                        FixedMeasurement,
                                        :count,
                                      ).by(3)

      session_1 = Session.find_by(latitude: 46.386, longitude: -62.583)
      session_2 = Session.find_by(latitude: 44.647, longitude: -63.574)

      expect(session_1.start_time_local).to eq(
        Time.zone.parse('2025-07-24T07:00:00'),
      )
      expect(session_1.end_time_local).to eq(
        Time.zone.parse('2025-07-24T07:00:00'),
      )
      expect(session_1.last_measurement_at).to eq(
        Time.zone.parse('2025-07-24T10:00:00'),
      )

      expect(session_2.start_time_local).to eq(
        Time.zone.parse('2025-07-24T07:00:00'),
      )
      expect(session_2.end_time_local).to eq(
        Time.zone.parse('2025-07-24T08:00:00'),
      )
      expect(session_2.last_measurement_at).to eq(
        Time.zone.parse('2025-07-24T11:00:00'),
      )

      stream_1 = session_1.streams.find_by(sensor_name: 'Government-PM2.5')
      stream_2 = session_2.streams.find_by(sensor_name: 'Government-NO2')

      expect(stream_1.sensor_name).to eq('Government-PM2.5')
      expect(stream_1.average_value).to eq(5.3)
      expect(stream_2.sensor_name).to eq('Government-NO2')
      expect(stream_2.average_value).to eq(5.2)
    end
  end
end
