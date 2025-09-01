require 'rails_helper'

RSpec.describe AirNowStreaming::StreamsUpdater do
  subject { described_class.new }

  describe '#call' do
    it 'updates session timestamps and creates fixed measurements' do
      session_1 =
        create(
          :fixed_session,
          latitude: 46.386,
          longitude: -62.583,
          time_zone: 'America/Halifax',
          end_time_local: Time.zone.parse('2025-07-24T06:00:00'),
        )

      session_2 =
        create(
          :fixed_session,
          latitude: 44.647,
          longitude: -63.574,
          time_zone: 'America/Halifax',
          end_time_local: Time.zone.parse('2025-07-24T06:00:00'),
        )

      stream_1 =
        create(:stream, session: session_1, sensor_name: 'Government-PM2.5')
      stream_2 =
        create(:stream, session: session_2, sensor_name: 'Government-NO2')

      measurements_to_create = {
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

      expect {
        subject.call(measurements_to_create: measurements_to_create)
      }.to change(FixedMeasurement, :count).by(3)

      session_1.reload
      session_2.reload

      expect(session_1.end_time_local).to eq(
        Time.zone.parse('2025-07-24T07:00:00'),
      )
      expect(session_1.last_measurement_at).to eq(
        Time.zone.parse('2025-07-24T10:00:00'),
      )

      expect(session_2.end_time_local).to eq(
        Time.zone.parse('2025-07-24T08:00:00'),
      )
      expect(session_2.last_measurement_at).to eq(
        Time.zone.parse('2025-07-24T11:00:00'),
      )
    end

    context 'when measurement time is before session end time' do
      it 'does not update session timestamps' do
        session =
          create(
            :fixed_session,
            latitude: 46.386,
            longitude: -62.583,
            time_zone: 'America/Halifax',
            end_time_local: Time.zone.parse('2025-07-24T06:00:00'),
            last_measurement_at: Time.zone.parse('2025-07-24T09:00:00'),
          )

        stream =
          create(:stream, session: session, sensor_name: 'Government-PM2.5')

        measurements_to_create = {
          stream => [
            {
              time: Time.zone.parse('2025-07-24T05:00:00'),
              time_with_time_zone: Time.zone.parse('2025-07-24T08:00:00'),
              time_zone: 'America/Halifax',
              title: 'SOUTHAMPTON',
              value: 5.3,
            },
          ],
        }

        expect {
          subject.call(measurements_to_create: measurements_to_create)
        }.to change(FixedMeasurement, :count).by(1)

        session.reload

        expect(session.end_time_local).to eq(
          Time.zone.parse('2025-07-24T06:00:00'),
        )
        expect(session.last_measurement_at).to eq(
          Time.zone.parse('2025-07-24T09:00:00'),
        )
      end
    end
  end
end
