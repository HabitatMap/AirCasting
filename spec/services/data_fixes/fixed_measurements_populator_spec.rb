require 'rails_helper'

RSpec.describe DataFixes::FixedMeasurementsPopulator, type: :service do
  let(:logger) { Logger.new(nil) }
  subject { described_class.new(logger: logger) }

  describe '#call' do
    it 'processes streams and inserts measurements into fixed_measurements' do
      session1 = create(:fixed_session, time_zone: 'Europe/Warsaw')
      stream1 = create(:stream, session: session1, measurements_count: 2)
      session2 = create(:fixed_session, time_zone: 'America/New_York')
      stream2 = create(:stream, session: session2, measurements_count: 3)

      create(
        :measurement,
        stream: stream1,
        value: 10,
        time: '2025-07-01 12:00:00',
        time_with_time_zone: '2025-07-01 12:00:00 +0200',
      )
      create(
        :measurement,
        stream: stream1,
        value: 20,
        time: '2025-07-01 13:00:00',
        time_with_time_zone: '2025-07-01 13:00:00 +0200',
      )
      create(
        :measurement,
        stream: stream2,
        value: 30,
        time: '2025-07-01 14:00:00',
        time_with_time_zone: '2025-07-01 14:00:00 -0400',
      )
      create(
        :measurement,
        stream: stream2,
        value: 40,
        time: '2025-07-01 15:00:00',
        time_with_time_zone: '2025-07-01 15:00:00 -0400',
      )
      create(
        :measurement,
        stream: stream2,
        value: 50,
        time: '2025-07-01 16:00:00',
        time_with_time_zone: '2025-07-01 16:00:00 -0400',
      )

      subject.call

      expect(FixedMeasurement.count).to eq(5)

      fixed_measurements_stream1 = FixedMeasurement.where(stream_id: stream1.id)
      expect(fixed_measurements_stream1.count).to eq(2)
      expect(fixed_measurements_stream1.pluck(:value)).to match_array([10, 20])

      fixed_measurements_stream2 = FixedMeasurement.where(stream_id: stream2.id)
      expect(fixed_measurements_stream2.count).to eq(3)
      expect(fixed_measurements_stream2.pluck(:value)).to match_array(
        [30, 40, 50],
      )
    end
  end
end
