require "spec_helper"

describe MeasurementsCreator do
  it "creates a measurement" do
    session = create_session!
    stream = create_stream!(session: session)

    MeasurementsCreator.call(stream, measurements_attributes)

    expect(Measurement.count).to eq(1)
  end

  it "when sessions fixed creates a measurement with utc time" do
    session = create_session!(type: "FixedSession")
    stream = create_stream!(session: session)

    MeasurementsCreator.call(stream, measurements_attributes)

    expect(Measurement.first.utc_time).to be_within(1.second).of Time.now
  end

  it "when session is moblie creates a measurement without utc time" do
    session = create_session!(type: "MoblieSession")
    stream = create_stream!(session: session)

    MeasurementsCreator.call(stream, measurements_attributes)

    expect(Measurement.first.utc_time).to be_nil
  end

  private

  def measurements_attributes
    [{ longitude: 25.4356212,
      latitude: 56.4523456,
      time: "2016-05-11T17:09:02",
      milliseconds: 925,
      measured_value: 59.15683475380729,
      value: 59.15683475380729,
    }]
  end

  def create_stream!(attributes)
    Stream.create!(
      sensor_package_name: "AirBeam2:00189610719F",
      sensor_name: "AirBeam2-F",
      measurement_type: "Temperature",
      unit_name: "Fahrenheit",
      session: attributes[:session],
      measurement_short_type: "dB",
      unit_symbol: "dB",
      threshold_very_low: 20,
      threshold_low: 60,
      threshold_medium: 70,
      threshold_high: 80,
      threshold_very_high: 100
    )
  end

  def create_session!(attributes = { type: "MobileSession" })
    Session.create!(
      title: "Example Session",
      user: User.new,
      uuid: "845342a6-f9f4-4835-86b3-b100163ec39a",
      calibration: 100,
      offset_60_db: 0,
      start_time: DateTime.current,
      start_time_local: DateTime.current,
      end_time: DateTime.current,
      end_time_local: DateTime.current,
      type: attributes[:type]
    )
  end
end
