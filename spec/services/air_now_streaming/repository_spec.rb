require 'rails_helper'

RSpec.describe AirNowStreaming::Repository do
  subject { described_class.new }

  describe '#air_now_streams' do
    it 'returns streams associated through sessions with the US EPA AirNow user' do
      user = create(:user, username: 'US EPA AirNow')
      session_1 = create(:fixed_session, user: user)
      session_2 = create(:fixed_session, user: user)
      stream_1 = create(:stream, session: session_1)
      stream_2 = create(:stream, session: session_2)
      other_user = create(:user, username: 'Other User')
      create(:fixed_session, user: other_user)

      result = subject.air_now_streams

      expect(result).to match_array([stream_1, stream_2])
    end
  end
end
