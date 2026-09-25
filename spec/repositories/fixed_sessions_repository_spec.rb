require 'rails_helper'

describe FixedSessionsRepository do
  subject { described_class.new }

  describe '#active_with_streams' do
    it 'returns fixed active sessions' do
      fixed_active_session_1 =
        create_session!(
          { type: 'FixedSession', last_measurement_at: Time.current },
        )
      fixed_active_session_2 =
        create_session!(
          { type: 'FixedSession', last_measurement_at: Time.current },
        )
      fixed_inactive_session =
        create_session!(
          { type: 'FixedSession', last_measurement_at: Time.current - 3.days },
        )
      mobile_session = create_session!({ type: 'MobileSession' })

      result = subject.active_with_streams

      expect(result).to match_array(
        [fixed_active_session_1, fixed_active_session_2],
      )
    end

    it 'includes associated streams' do
      session =
        create_session!(
          { type: 'FixedSession', last_measurement_at: Time.current },
        )
      create_stream!({ session: session })

      result = subject.active_with_streams

      expect(result.first.association(:streams).loaded?).to eq(true)
      expect(result.first.association(:user).loaded?).to eq(true)
    end
  end

  # Client decision, 2026-09-25: `last_measurement_at` means two different things
  # by source. On an AirBeam it answers "when did this device last reach us",
  # which is what the dormant/active split and the stopped-session alert read. On
  # a government station it stays the measurement's own timestamp, written by the
  # loaders — a station reporting six hours late is six hours stale. This
  # repository serves the AirBeam paths only.
  describe '#update_timestamps_after_ingest!' do
    let(:session) do
      create(
        :fixed_session,
        time_zone: 'Europe/Warsaw',
        end_time_local: Time.utc(2026, 9, 20, 10, 0, 0),
        last_measurement_at: Time.utc(2026, 9, 20, 8, 0, 0),
      )
    end

    def measurement_at(local)
      FixedMeasurement.new(
        time: local,
        time_with_time_zone: Utils.from_local_as_utc(local, session.time_zone),
      )
    end

    it 'records the contact moment, not the reading time' do
      freeze_time do
        subject.update_timestamps_after_ingest!(
          session: session,
          last_measurement: measurement_at(Time.utc(2026, 9, 20, 11, 0, 0)),
        )

        expect(session.reload.last_measurement_at).to eq(Time.current)
      end
    end

    it 'marks the device alive even when the batch is an old backlog' do
      freeze_time do
        subject.update_timestamps_after_ingest!(
          session: session,
          last_measurement: measurement_at(Time.utc(2026, 9, 13, 9, 0, 0)),
        )

        expect(session.reload.last_measurement_at).to eq(Time.current)
      end
    end

    it 'moves end_time_local forward with the reading' do
      subject.update_timestamps_after_ingest!(
        session: session,
        last_measurement: measurement_at(Time.utc(2026, 9, 20, 11, 0, 0)),
      )

      expect(session.reload.end_time_local).to eq(Time.utc(2026, 9, 20, 11, 0, 0))
    end

    it 'never drags end_time_local back behind what is already stored' do
      subject.update_timestamps_after_ingest!(
        session: session,
        last_measurement: measurement_at(Time.utc(2026, 9, 13, 9, 0, 0)),
      )

      expect(session.reload.end_time_local).to eq(Time.utc(2026, 9, 20, 10, 0, 0))
    end
  end
end
