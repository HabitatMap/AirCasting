require 'rails_helper'

describe GovernmentSources::StationStreamTimestampsUpdater do
  subject { described_class.new }

  describe '#call' do
    it 'sets first_measured_at and last_measured_at from measurements bounds' do
      t1 = Time.parse('2025-01-01 08:00:00 UTC')
      t2 = Time.parse('2025-01-01 10:00:00 UTC')
      t3 = Time.parse('2025-01-01 12:00:00 UTC')
      stream =
        create(:station_stream, first_measured_at: t1, last_measured_at: t2)

      subject.call(
        measurements: [
          { station_stream_id: stream.id, measured_at: t1, value: 10.0 },
          { station_stream_id: stream.id, measured_at: t2, value: 11.0 },
          { station_stream_id: stream.id, measured_at: t3, value: 12.0 },
        ],
      )

      stream.reload
      expect(stream.first_measured_at).to eq(t1)
      expect(stream.last_measured_at).to eq(t3)
    end
  end
end
