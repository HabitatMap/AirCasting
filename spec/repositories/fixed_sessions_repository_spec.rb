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
    end
  end
end
