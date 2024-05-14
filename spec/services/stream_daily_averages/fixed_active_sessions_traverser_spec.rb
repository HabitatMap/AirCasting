require 'rails_helper'

describe StreamDailyAverages::FixedActiveSessionsTraverser do
  let(:stream_interactor) do
    instance_double('StreamDailyAverages::StreamInteractor')
  end
  subject { described_class.new(stream_interactor: stream_interactor) }

  describe '#call' do
    context 'when there are active fixed sessions' do
      it 'travers over fixed active sessions and calls streams interactor for each associated stream' do
        time_zone = 'Europe/Warsaw'
        fixed_session =
          create_session!(type: 'FixedSession', time_zone: time_zone)
        stream_1 = create_stream!(session: fixed_session)
        stream_2 = create_stream!(session: fixed_session)
        _mobile_session = create_session!(type: 'MobileSession')
        _mobile_stream = create_stream!(session: _mobile_session)

        expect(stream_interactor).to receive(:call).with(
          { stream_id: stream_1.id, time_zone: time_zone, is_air_now_stream: false},
        )
        expect(stream_interactor).to receive(:call).with(
          { stream_id: stream_2.id, time_zone: time_zone, is_air_now_stream: false},
        )

        subject.call
      end
    end

    context 'when there is an active AirNow session' do
      it 'traverses over AirNow streams and calls streams interactor for associated stream' do
        time_zone = 'Europe/Warsaw'
        user = User.create!(email: 'airnow@example.com', username: 'US EPA AirNow', password: 'password')
        fixed_session = create_session!(type: 'FixedSession', time_zone: time_zone, user: user)
        stream = create_stream!(session: fixed_session)

        expect(stream_interactor).to receive(:call).with(
          {stream_id: stream.id, time_zone: time_zone, is_air_now_stream: true}
        )

        subject.call
      end
    end
  end
end
