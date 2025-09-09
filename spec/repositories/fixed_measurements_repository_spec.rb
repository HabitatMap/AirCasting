require 'rails_helper'

RSpec.describe FixedMeasurementsRepository do
  subject { described_class.new }

  describe '#import' do
    it 'imports measurements into the FixedMeasurement table' do
      stream = create(:stream)
      measurements = [
        FixedMeasurement.new(
          stream: stream,
          value: 10,
          time: '2025-01-01 12:00:00',
          time_with_time_zone: '2025-01-01 12:00:00 UTC',
        ),
        FixedMeasurement.new(
          stream: stream,
          value: 20,
          time: '2025-01-01 13:00:00',
          time_with_time_zone: '2025-01-01 13:00:00 UTC',
        ),
      ]

      subject.import(measurements: measurements, on_duplicate_key_ignore: true)

      expect(FixedMeasurement.count).to eq(2)
      expect(FixedMeasurement.pluck(:value)).to match_array([10, 20])
    end

    it 'does not insert duplicate measurements when on_duplicate_key_ignore is true' do
      stream = create(:stream)
      create(
        :fixed_measurement,
        stream: stream,
        value: 10,
        time: '2025-01-01 12:00:00',
        time_with_time_zone: '2025-01-01 12:00:00 UTC',
      )
      create(
        :fixed_measurement,
        stream: stream,
        value: 20,
        time: '2025-01-01 13:00:00',
        time_with_time_zone: '2025-01-01 13:00:00 UTC',
      )

      measurements = [
        FixedMeasurement.new(
          stream: stream,
          value: 10,
          time: '2025-01-01 12:00:00',
          time_with_time_zone: '2025-01-01 12:00:00 UTC',
        ),
        FixedMeasurement.new(
          stream: stream,
          value: 20,
          time: '2025-01-01 13:00:00',
          time_with_time_zone: '2025-01-01 13:00:00 UTC',
        ),
      ]

      subject.import(measurements: measurements, on_duplicate_key_ignore: true)

      expect(FixedMeasurement.count).to eq(2)
    end

    it 'raises an error when on_duplicate_key_ignore is false and duplicates exist' do
      stream = create(:stream)
      create(
        :fixed_measurement,
        stream: stream,
        value: 10,
        time: '2025-01-01 12:00:00',
        time_with_time_zone: '2025-01-01 12:00:00 UTC',
      )

      measurements = [
        FixedMeasurement.new(
          stream: stream,
          value: 10,
          time: '2025-01-01 12:00:00',
          time_with_time_zone: '2025-01-01 12:00:00 UTC',
        ),
      ]

      expect {
        subject.import(
          measurements: measurements,
          on_duplicate_key_ignore: false,
        )
      }.to raise_error(ActiveRecord::RecordNotUnique)
    end
  end

  describe '#last_2_days' do
    it 'returns last two days of measurements for given stream' do
      stream = create(:stream, :fixed)
      measurement_1 =
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-01-15 09:00'),
        )
      measurement_2 =
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-01-14 10:00'),
        )
      measurement_3 =
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-01-13 09:00'),
        )
      create(
        :fixed_measurement,
        stream: stream,
        time_with_time_zone: Time.parse('2025-01-13 08:00'),
        value: 50,
      )
      create(
        :fixed_measurement,
        time_with_time_zone: Time.parse('2025-01-15 08:00'),
      )

      result = subject.last_2_days(stream_id: stream.id)

      expect(result).to match_array(
        [measurement_1, measurement_2, measurement_3],
      )
    end
  end

  describe '#streams_averages_hourly_last_7_days' do
    let(:stubbed_time_current) { Time.parse('2024-11-22 12:30:00 +00:00') }

    before { allow(Time).to receive(:current).and_return(stubbed_time_current) }

    context 'when with_hour_shift is true' do
      it 'returns average values calculated for preceding hour' do
        stream_1 = create(:stream)
        stream_2 = create(:stream)

        create(
          :fixed_measurement,
          stream: stream_1,
          value: 10,
          time_with_time_zone: Time.parse('2024-11-22 10:30:00 +00:00'),
        )
        create(
          :fixed_measurement,
          stream: stream_1,
          value: 12,
          time_with_time_zone: Time.parse('2024-11-22 11:00:00 +00:00'),
        )
        create(
          :fixed_measurement,
          stream: stream_2,
          value: 4,
          time_with_time_zone: Time.parse('2024-11-22 11:30:00 +00:00'),
        )
        create(
          :fixed_measurement,
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
          :fixed_measurement,
          stream: stream_1,
          value: 10,
          time_with_time_zone: Time.parse('2024-11-22 10:30:00 +00:00'),
        )
        create(
          :fixed_measurement,
          stream: stream_1,
          value: 12,
          time_with_time_zone: Time.parse('2024-11-22 11:00:00 +00:00'),
        )
        create(
          :fixed_measurement,
          stream: stream_2,
          value: 4,
          time_with_time_zone: Time.parse('2024-11-22 11:30:00 +00:00'),
        )
        create(
          :fixed_measurement,
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
