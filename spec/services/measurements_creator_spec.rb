require "spec_helper"

describe MeasurementsCreator do
  let(:measurements_attributes) { [{:longitude=>25.4356212, :latitude=>56.4523456, :time=>"2016-05-11T17:09:02", :milliseconds=>925, :measured_value=>59.15683475380729, :value=>59.15683475380729}] }

  it "creates a mesurement" do
    stream = create_stream!
    MeasurementsCreator.call(stream, measurements_attributes)

    expect(Measurement.count).to eq(1)
  end

  it "creates a mesurement with utc time for fixed sessions" do
    stream = create_stream!("FixedSession")
    MeasurementsCreator.call(stream, measurements_attributes)

    expect(Measurement.first.utc_time).to be_within(1.second).of Time.now
  end

  it "creates a mesurement without utc time for mobile sessions" do
    stream = create_stream!("MobileSession")
    MeasurementsCreator.call(stream, measurements_attributes)

    expect(Measurement.first.utc_time).to be_nil
  end

  private

  def create_stream!(session_type  = "MobileSession")
    Stream.create!(
      sensor_package_name: "AirBeam2:00189610719F",
      sensor_name: "AirBeam2-F",
      measurement_type: "Temperature",
      unit_name: "Fahrenheit",
      session: create_session!(session_type),
      measurement_short_type: "dB",
      unit_symbol: "dB",
      threshold_very_low: 20,
      threshold_low: 60,
      threshold_medium: 70,
      threshold_high: 80,
      threshold_very_high: 100
    )
  end

  def create_session!(type)
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
      type: type
    )
  end
end
