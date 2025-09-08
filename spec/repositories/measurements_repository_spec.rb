require 'rails_helper'

describe MeasurementsRepository do
  subject { described_class.new }

  describe '#streams_averages_hourly_last_7_days' do
    let(:stubbed_time_current) { Time.parse('2024-11-22 12:30:00 +00:00') }

    before { allow(Time).to receive(:current).and_return(stubbed_time_current) }

    context 'when with_hour_shift is true' do
      it 'returns average values calculated for preceding hour' do
        stream_1 = create(:stream)
        stream_2 = create(:stream)

        create(
          :measurement,
          stream: stream_1,
          value: 10,
          time_with_time_zone: Time.parse('2024-11-22 10:30:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_1,
          value: 12,
          time_with_time_zone: Time.parse('2024-11-22 11:00:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_2,
          value: 4,
          time_with_time_zone: Time.parse('2024-11-22 11:30:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_2,
          value: 2,
          time_with_time_zone: Time.parse('2024-11-22 12:30:00 +00:00'),
        )

        result =
          subject.streams_averages_hourly_last_7_days(
            stream_ids: [stream_1.id, stream_2.id],
            with_hour_shift: true,
          )

        expect(result).to match_array(
          [
            { time: Time.parse('2024-11-22 11:00:00 +00:00'), value: 10 },
            { time: Time.parse('2024-11-22 12:00:00 +00:00'), value: 8 },
          ],
        )
      end
    end

    context 'when with_hour_shift is false' do
      it 'returns average values calculated for succeeding hour' do
        stream_1 = create(:stream)
        stream_2 = create(:stream)

        create(
          :measurement,
          stream: stream_1,
          value: 10,
          time_with_time_zone: Time.parse('2024-11-22 10:30:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_1,
          value: 12,
          time_with_time_zone: Time.parse('2024-11-22 11:00:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_2,
          value: 4,
          time_with_time_zone: Time.parse('2024-11-22 11:30:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_2,
          value: 2,
          time_with_time_zone: Time.parse('2024-11-22 12:30:00 +00:00'),
        )

        result =
          subject.streams_averages_hourly_last_7_days(
            stream_ids: [stream_1.id, stream_2.id],
            with_hour_shift: false,
          )

        expect(result).to match_array(
          [
            { time: Time.parse('2024-11-22 10:00:00 +00:00'), value: 10 },
            { time: Time.parse('2024-11-22 11:00:00 +00:00'), value: 8 },
          ],
        )
      end
    end
  end
end
