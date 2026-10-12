require 'rails_helper'

describe GovernmentSources::StationStreamDailyAveragesRebuilder do
  subject { described_class.new }

  describe '#call' do
    it 'rebuilds the whole history in the current time zone, dropping dates the old zone left behind' do
      travel_to Time.parse('2026-03-20 12:00:00 UTC') do
        stream =
          create(
            :station_stream,
            time_zone: 'America/New_York',
            first_measured_at: Time.parse('2026-03-01 03:00:00 UTC'),
            last_measured_at: Time.parse('2026-03-02 03:00:00 UTC'),
          )
        # 2026-03-01 03:00 UTC is 2026-02-28 22:00 in New York.
        create(:station_measurement, station_stream: stream, measured_at: Time.parse('2026-03-01 03:00:00 UTC'), value: 10)
        create(:station_measurement, station_stream: stream, measured_at: Time.parse('2026-03-02 03:00:00 UTC'), value: 30)
        # As stored under UTC.
        create(:station_stream_daily_average, station_stream: stream, date: Date.parse('2026-03-02'), value: 30)
        create(:station_stream_daily_average, station_stream: stream, date: Date.parse('2026-03-01'), value: 10)

        subject.call(stream_ids: [stream.id])

        expect(
          StationStreamDailyAverage.where(station_stream: stream).order(:date).pluck(:date, :value),
        ).to eq([[Date.parse('2026-02-28'), 10], [Date.parse('2026-03-01'), 30]])
      end
    end

    it 'only clears a stream with no measurements' do
      stream = create(:station_stream, first_measured_at: nil, last_measured_at: nil)
      create(:station_stream_daily_average, station_stream: stream, date: Date.parse('2026-03-01'), value: 10)

      subject.call(stream_ids: [stream.id])

      expect(StationStreamDailyAverage.where(station_stream: stream)).to be_empty
    end
  end
end
