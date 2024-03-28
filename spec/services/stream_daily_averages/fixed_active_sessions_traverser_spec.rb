require 'rails_helper'

describe StreamDailyAverages::FixedActiveSessionsTraverser do
  let(:stream_interactor) do
    instance_double('StreamDailyAverages::StreamInteractor')
  end
  subject { described_class.new(stream_interactor: stream_interactor) }

  describe '#call' do
    it 'travers over fixed active sessions and calls streams interactor for each associated stream' do
      time_zone = 'Europe/Warsaw'
      fixed_session =
        create_session!(type: 'FixedSession', time_zone: time_zone)
      stream_1 = create_stream!(session: fixed_session)
      stream_2 = create_stream!(session: fixed_session)
      _mobile_session = create_session!(type: 'MobileSession')
      _mobile_stream = create_stream!(session: _mobile_session)

      expect(stream_interactor).to receive(:call).with(
        { stream_id: stream_1.id, time_zone: time_zone },
      )
      expect(stream_interactor).to receive(:call).with(
        { stream_id: stream_2.id, time_zone: time_zone },
      )

      subject.call
    end
  end
end
