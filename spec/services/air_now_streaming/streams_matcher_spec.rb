require 'rails_helper'

RSpec.describe AirNowStreaming::StreamsMatcher do
  subject { described_class.new }
  describe '#call' do
    it 'matches parsed measurements with existing streams and identifies unmatched measurements' do
      user = create(:user, username: 'US EPA AirNow')
      session_1 =
        create(:fixed_session, user: user, latitude: 46.386, longitude: -62.583)
      session_2 =
        create(:fixed_session, user: user, latitude: 46.386, longitude: -62.583)

      threshold_set_pm25 =
        create(:threshold_set, sensor_name: 'Government-PM2.5')
      threshold_set_no2 = create(:threshold_set, sensor_name: 'Government-NO2')

      stream_1 =
        create(:stream, session: session_1, threshold_set: threshold_set_pm25)
      stream_2 =
        create(:stream, session: session_2, threshold_set: threshold_set_no2)

      parsed_measurements = {
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
          latitude: 46.386,
          longitude: -62.583,
          sensor_name: 'Government-NO2',
        } => [
          {
            time: Time.zone.parse('2025-07-24T07:00:00'),
            time_with_time_zone: Time.zone.parse('2025-07-24T10:00:00'),
            time_zone: 'America/Halifax',
            title: 'SOUTHAMPTON',
            value: 0.7,
          },
        ],
        {
          latitude: 44.647,
          longitude: -63.574,
          sensor_name: 'Government-PM2.5',
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

      expected_matched_measurements = {
        stream_1 => [
          {
            time: Time.zone.parse('2025-07-24T07:00:00'),
            time_with_time_zone: Time.zone.parse('2025-07-24T10:00:00'),
            time_zone: 'America/Halifax',
            title: 'SOUTHAMPTON',
            value: 5.3,
          },
        ],
        stream_2 => [
          {
            time: Time.zone.parse('2025-07-24T07:00:00'),
            time_with_time_zone: Time.zone.parse('2025-07-24T10:00:00'),
            time_zone: 'America/Halifax',
            title: 'SOUTHAMPTON',
            value: 0.7,
          },
        ],
      }

      expected_unmatched_measurements = {
        {
          latitude: 44.647,
          longitude: -63.574,
          sensor_name: 'Government-PM2.5',
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

      matched_measurements, unmatched_measurements =
        subject.call(parsed_measurements: parsed_measurements)

      expect(matched_measurements).to eq(expected_matched_measurements)
      expect(unmatched_measurements).to eq(expected_unmatched_measurements)
    end
  end
end
