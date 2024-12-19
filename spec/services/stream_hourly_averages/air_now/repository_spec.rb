require 'rails_helper'

RSpec.describe StreamHourlyAverages::AirNow::Repository do
  subject { described_class.new }

  describe '#latest_stream_hourly_averages' do
    it 'returns the latest stream hourly averages for the given stream ids' do
      stream_1 = create(:stream, :fixed)
      stream_2 = create(:stream, :fixed)
      other_stream = create(:stream, :fixed)

      latest_for_stream_1 =
        create(
          :stream_hourly_average,
          stream: stream_1,
          date_time: Time.parse('2024-12-19 11:00:00'),
        )
      latest_for_stream_2 =
        create(
          :stream_hourly_average,
          stream: stream_2,
          date_time: Time.parse('2024-12-19 10:00:00'),
        )
      create(
        :stream_hourly_average,
        stream: stream_1,
        date_time: Time.parse('2024-12-19 09:00:00'),
      )
      create(
        :stream_hourly_average,
        stream: stream_2,
        date_time: Time.parse('2024-12-18 12:00:00'),
      )
      create(:stream_hourly_average, stream: other_stream)

      expect(
        subject.latest_stream_hourly_averages(
          stream_ids: [stream_1.id, stream_2.id],
        ),
      ).to match_array([latest_for_stream_1, latest_for_stream_2])
    end
  end
end
