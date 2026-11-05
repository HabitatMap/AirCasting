require 'rails_helper'

describe Explore::StationMeasurementsQuery do
  let(:anchor) { Time.utc(2026, 8, 14, 12, 0, 0) }
  let(:recent) { anchor - 30.minutes }
  let(:old) { anchor - 10.hours }

  def epoch_ms(time) = time.to_i * 1_000

  def ref(source:, id:, last_measured_at: anchor)
    Explore::StreamItem.new(
      source: source, id: id, sensor_name: 'whatever', last_measured_at: last_measured_at,
    )
  end

  describe 'an AirBeam stream' do
    let(:stream) { create(:stream, :fixed) }

    before do
      create(:fixed_measurement, stream: stream, value: 12.5,
             time: recent, time_with_time_zone: recent)
      create(:fixed_measurement, stream: stream, value: 9.0,
             time: old, time_with_time_zone: old)
    end

    it 'defaults to the last 6 hours, anchored on the last reading' do
      points = described_class.new(stream: ref(source: 'airbeam', id: stream.id)).call

      expect(points).to eq([{ time: epoch_ms(recent), value: 12.5 }])
    end

    it 'answers an explicit window, ascending' do
      create(:fixed_measurement, stream: stream, value: 10.0,
             time: old + 1.minute, time_with_time_zone: old + 1.minute)

      points =
        described_class.new(
          stream: ref(source: 'airbeam', id: stream.id),
          start_time: epoch_ms(anchor - 11.hours),
          end_time: epoch_ms(anchor - 9.hours),
        ).call

      expect(points).to eq(
        [{ time: epoch_ms(old), value: 9.0 },
         { time: epoch_ms(old + 1.minute), value: 10.0 }],
      )
    end

    # Both columns are written from one timestamp, so they agree on real rows;
    # forcing them apart is the only way to show which one bounds the window.
    it 'windows on time_with_time_zone, not time' do
      create(:fixed_measurement, stream: stream, value: 77.0,
             time: recent, time_with_time_zone: recent - 2.days)

      points = described_class.new(stream: ref(source: 'airbeam', id: stream.id)).call

      expect(points.map { |point| point[:value] }).to eq([12.5])
    end
  end

  describe 'a government stream' do
    let(:station_stream) { create(:station_stream) }

    before do
      create(:station_measurement, station_stream: station_stream,
             measured_at: recent, value: 8.5)
      create(:station_measurement, station_stream: station_stream, measured_at: old, value: 3.0)
    end

    it 'reads station_measurements' do
      points = described_class.new(stream: ref(source: 'government', id: station_stream.id)).call

      expect(points).to eq([{ time: epoch_ms(recent), value: 8.5 }])
    end
  end

  # No last reading means no anchor for the default window, and nothing to
  # return either.
  it 'is empty for a stream that has never reported' do
    stream = create(:stream, :fixed)

    points =
      described_class.new(stream: ref(source: 'airbeam', id: stream.id, last_measured_at: nil)).call

    expect(points).to eq([])
  end
end
