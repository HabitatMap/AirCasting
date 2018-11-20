require "spec_helper"

describe MeasurementsCreator do
  describe ".call" do
    let(:arrival_utc_time) { Time.utc(2018, 11, 19) }

    before do
      allow(Time).to receive(:current).and_return(arrival_utc_time)
    end

    context "when there is only one measurement" do
      it "creates a measurement" do
        session = create_session!
        stream = create_stream!(session: session)

        MeasurementsCreator.call(stream, single_measurement_attributes)

        expect(Measurement.count).to eq(1)
      end

      it "when sessions is fixed creates a measurement with utc time" do
        session = create_session!(type: "FixedSession")
        stream = create_stream!(session: session)

        MeasurementsCreator.call(stream, single_measurement_attributes)

        expect(Measurement.first.arrival_utc_time).to eq(arrival_utc_time)
      end

      it "when session is mobile creates a measurement without utc time" do
        session = create_session!(type: "MoblieSession")
        stream = create_stream!(session: session)

        MeasurementsCreator.call(stream, single_measurement_attributes)

        expect(Measurement.first.arrival_utc_time).to be_nil
      end
    end

    context "when there are more than one measurements" do
      it "schedules the creation of measurements" do
        session = create_session!
        stream = create_stream!(session: session)

        MeasurementsCreator.call(stream, multiple_measurements_attributes)

        expect(AsyncMeasurementsCreator.jobs.size).to be(1)
      end
    end
  end

  describe "#call" do
    let(:streams_repository) { double("streams_repository" ) }
    let(:measurements_creator) { MeasurementsCreator.new(streams_repository) }
    let(:stream) { double("stream") }

    before do
      allow(stream).to receive(:after_measurements_created)
      allow(stream).to receive(:build_measurements!)
      allow(streams_repository).to receive(:calc_average_value!)
      allow(streams_repository).to receive(:calc_bounding_box!)
      allow(stream).to receive(:fixed?)
    end

    context "for all sessions" do
      it "delegates building the measurements" do
        expect(stream).to receive(:build_measurements!).with(single_measurement_attributes)

        measurements_creator.call(stream, single_measurement_attributes)
      end

      it "performs a callback after measuremnets are created" do
        expect(stream).to receive(:after_measurements_created).with(no_args)

        measurements_creator.call(stream, single_measurement_attributes)
      end
    end

    context "for sessions that are not fixed" do
      before do
        allow(stream).to receive(:fixed?).and_return(false)
      end

      it "calculates bounding box of stream" do
        expect(streams_repository).to receive(:calc_bounding_box!).with(stream)

        measurements_creator.call(stream, single_measurement_attributes)
      end

      it "calculates average value of stream" do
        expect(streams_repository).to receive(:calc_average_value!).with(stream)

        measurements_creator.call(stream, single_measurement_attributes)
      end
    end
  end

  private

  def multiple_measurements_attributes
    [measurement_attributes, measurement_attributes]
  end

  def single_measurement_attributes
    [measurement_attributes]
  end

  def measurement_attributes
    { longitude: 25.4356212,
      latitude: 56.4523456,
      time: "2016-05-11T17:09:02",
      milliseconds: 925,
      measured_value: 59.15683475380729,
      value: 59.15683475380729,
    }
  end

  def create_stream!(attributes)
    Stream.create!(
      sensor_package_name: "AirBeam2:00189610719F",
      sensor_name: "AirBeam2-F",
      measurement_type: "Temperature",
      unit_name: "Fahrenheit",
      session: attributes.fetch(:session),
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
      type: attributes.fetch(:type)
    )
  end
end
