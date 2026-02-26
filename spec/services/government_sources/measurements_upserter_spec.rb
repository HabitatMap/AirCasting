require 'rails_helper'

describe GovernmentSources::MeasurementsUpserter do
  subject { described_class.new }

  describe '#call' do
    it 'creates station measurements from measurements data' do
      station_stream = create(:station_stream)

      measurements_data = [
        {
          station_stream_id: station_stream.id,
          measured_at: Time.parse('2025-07-24 10:00:00 UTC'),
          value: 12.5,
        },
        {
          station_stream_id: station_stream.id,
          measured_at: Time.parse('2025-07-24 11:00:00 UTC'),
          value: 14.0,
        },
      ]

      expect { subject.call(measurements_data: measurements_data) }.to change(
        StationMeasurement,
        :count,
      ).by(2)
    end

    it 'does nothing when measurements is empty' do
      expect { subject.call(measurements_data: []) }.not_to change(
        StationMeasurement,
        :count,
      )
    end
  end
end
