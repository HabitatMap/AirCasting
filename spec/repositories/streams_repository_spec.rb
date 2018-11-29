require "spec_helper"

describe StreamsRepository do
  it "#calc_bounding_box! recalculates the bounding box and saves to database" do
    stream = create_stream!({
      min_latitude: 1,
      max_latitude: 2,
      min_longitude: 3,
      max_longitude: 4
    })

    create_measurement!({
      latitude: 6,
      longitude: 7,
      stream: stream
    })

    create_measurement!({
      latitude: 5,
      longitude: 8,
      stream: stream
    })

    calculate_bounding_box = double
    expect(calculate_bounding_box).to receive(:call).with(stream.measurements.select([:latitude, :longitude])) {
      {
        min_latitude: 5,
        max_latitude: 6,
        min_longitude: 7,
        max_longitude: 8
      }
    }


    StreamsRepository.new.calc_bounding_box!(stream, calculate_bounding_box)
    actual = StreamsRepository.new.find(stream.id)


    expect(actual.min_latitude).to eq(5)
    expect(actual.max_latitude).to eq(6)
    expect(actual.min_longitude).to eq(7)
    expect(actual.max_longitude).to eq(8)
  end

  private

  def create_stream!(attributes)
    Stream.create!(
      sensor_package_name: "abc",
      sensor_name: "abc",
      measurement_type: "abc",
      unit_name: "abc",
      session_id: 123,
      measurement_short_type: "dB",
      unit_symbol: "dB",
      threshold_very_low: 20,
      threshold_low: 60,
      threshold_medium: 70,
      threshold_high: 80,
      threshold_very_high: 100,
      min_latitude: attributes.fetch(:min_latitude),
      max_latitude: attributes.fetch(:max_latitude),
      min_longitude: attributes.fetch(:min_longitude),
      max_longitude: attributes.fetch(:max_longitude)
    )
  end

  def create_measurement!(attributes)
    Measurement.create!(
      time: DateTime.current,
      latitude: attributes.fetch(:latitude),
      longitude: attributes.fetch(:longitude),
      value: 123,
      milliseconds: 123,
      stream: attributes.fetch(:stream)
    )
  end
end
