require 'rails_helper'

describe StreamDailyAverages::FixedActiveSessionsTraverser do
  subject { described_class.new }

  describe '#call' do
    let(:stubbed_current_time) { Time.parse('2025-01-14 17:00 +00:00') }
    before { allow(Time).to receive(:current).and_return(stubbed_current_time) }

    it 'creates stream daily averages for each stream associated with active fixed sessions' do
      session_1 =
        create(
          :fixed_session,
          time_zone: 'America/New_York',
          last_measurement_at: Time.parse('2025-01-14 15:00 +00:00'),
        )
      session_2 =
        create(
          :fixed_session,
          time_zone: 'Europe/Warsaw',
          last_measurement_at: Time.parse('2025-01-14 10:00 +00:00'),
        )
      stream_1 = create(:stream, session: session_1)
      stream_2 = create(:stream, session: session_2)

      m_1_1 =
        create(
          :measurement,
          stream: stream_1,
          value: 1,
          time_with_time_zone: Time.parse('2025-01-14 11:00 -05:00'),
        )
      m_1_2 =
        create(
          :measurement,
          stream: stream_1,
          value: 5,
          time_with_time_zone: Time.parse('2025-01-14 10:00 -05:00'),
        )
      _m_1_other_day =
        create(
          :measurement,
          stream: stream_1,
          time_with_time_zone: Time.parse('2025-01-13 23:00 -05:00'),
        )

      m_2_1 =
        create(
          :measurement,
          stream: stream_2,
          value: 2,
          time_with_time_zone: Time.parse('2025-01-14 11:00 +01:00'),
        )
      m_2_2 =
        create(
          :measurement,
          stream: stream_2,
          value: 6,
          time_with_time_zone: Time.parse('2025-01-14 10:00 +01:00'),
        )
      _m_2_other_day =
        create(
          :measurement,
          stream: stream_2,
          time_with_time_zone: Time.parse('2025-01-13 08:00 +01:00'),
        )

      expect { subject.call }.to change(StreamDailyAverage, :count).by(2)

      stream_daily_average_1 =
        StreamDailyAverage.find_by(stream_id: stream_1.id)
      stream_daily_average_2 =
        StreamDailyAverage.find_by(stream_id: stream_2.id)

      expect(stream_daily_average_1).to have_attributes(
        value: 3,
        date: Date.parse('2025-01-14'),
      )
      expect(stream_daily_average_2).to have_attributes(
        value: 4,
        date: Date.parse('2025-01-14'),
      )
    end
  end
end
