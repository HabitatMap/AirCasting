require 'rails_helper'

RSpec.describe StreamHourlyAverages::Updater do
  subject { described_class.new }

  describe '#call' do
    before { allow(Time).to receive(:current).and_return(stubbed_time_current) }
    let(:stubbed_time_current) { Time.parse('2024-12-10 12:10:00 +00:00') }

    it 'creates stream_hourly_average records and updates stream references to last_hourly_average' do
      #TODO: remove once stream_configuration is in place
      create(:user, username: 'US EPA AirNow')

      stream = create(:stream, :fixed, last_hourly_average: nil)
      create(
        :measurement,
        stream: stream,
        time_with_time_zone: Time.parse('2024-12-10 11:10:00 +00:00'),
        value: 2,
      )
      create(
        :measurement,
        stream: stream,
        time_with_time_zone: Time.parse('2024-12-10 11:20:00 +00:00'),
        value: 6,
      )

      subject.call

      stream_hourly_average = StreamHourlyAverage.last

      expect(stream_hourly_average).to have_attributes(
        stream_id: stream.id,
        value: 4,
        date_time: Time.parse('2024-12-10 12:00:00 +00:00'),
      )

      expect(stream.reload.last_hourly_average_id).to eq(
        stream_hourly_average.id,
      )
    end
  end
end
