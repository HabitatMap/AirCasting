require 'rails_helper'

RSpec.describe DataFixes::AirNowSessionsLatLongRounding do
  subject { described_class.new }

  let!(:user) { create(:user, username: 'US EPA AirNow') }
  let!(:session1) do
    create(
      :fixed_session,
      user: user,
      latitude: 44.941101,
      longitude: -105.837799,
    )
  end
  let!(:session2) do
    create(
      :fixed_session,
      user: user,
      latitude: 44.941567,
      longitude: -105.837123,
    )
  end
  let!(:stream1) do
    create(
      :stream,
      session: session1,
      min_latitude: 44.941101,
      min_longitude: -105.837799,
    )
  end
  let!(:stream2) do
    create(
      :stream,
      session: session2,
      min_latitude: 44.941567,
      min_longitude: -105.837123,
    )
  end

  describe '#call' do
    it 'rounds latitude and longitude to 3 decimal places for sessions and updates streams' do
      subject.call

      expect(session1.reload.latitude).to eq(44.941)
      expect(session1.reload.longitude).to eq(-105.838)
      expect(session2.reload.latitude).to eq(44.942)
      expect(session2.reload.longitude).to eq(-105.837)

      expect(stream1.reload.min_latitude).to eq(44.941)
      expect(stream1.reload.min_longitude).to eq(-105.838)
      expect(stream1.reload.max_latitude).to eq(44.941)
      expect(stream1.reload.max_longitude).to eq(-105.838)
      expect(stream1.reload.start_latitude).to eq(44.941)
      expect(stream1.reload.start_longitude).to eq(-105.838)

      expect(stream2.reload.min_latitude).to eq(44.942)
      expect(stream2.reload.min_longitude).to eq(-105.837)
      expect(stream2.reload.max_latitude).to eq(44.942)
      expect(stream2.reload.max_longitude).to eq(-105.837)
      expect(stream2.reload.start_latitude).to eq(44.942)
      expect(stream2.reload.start_longitude).to eq(-105.837)
    end

    it 'does not update sessions or streams if no rounding is needed' do
      session3 =
        create(
          :fixed_session,
          user: user,
          latitude: 44.941,
          longitude: -105.838,
        )
      stream3 =
        create(
          :stream,
          session: session3,
          min_latitude: 44.941,
          min_longitude: -105.838,
        )

      subject.call

      expect(session3.reload.latitude).to eq(44.941)
      expect(session3.reload.longitude).to eq(-105.838)
      expect(stream3.reload.min_latitude).to eq(44.941)
      expect(stream3.reload.min_longitude).to eq(-105.838)
    end
  end
end
