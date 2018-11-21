require "spec_helper"

describe Csv::ExportSessionsToCsv do
  before(:each) do
    @subject = Csv::ExportSessionsToCsv.new
  end

  after(:each) do
    @subject.clean
  end

  it "with no sessions the zip is empty" do
    session_ids = []

    zip_path = @subject.call(session_ids)

    Zip::File.open(zip_path) do |zip_file|
      expect(zip_file.size).to eq(0)
    end
  end

  it "with one session with one stream and with one measurement the zip contains one file with the right CSV content and filename" do
    session = create_session!(title: "Example Session")
    stream = create_stream!(
      sensor_package_name: "AirBeam2:00189610719F",
      sensor_name: "AirBeam2-F",
      measurement_type: "Temperature",
      unit_name: "Fahrenheit",
      session: session
    )
    measurement = create_measurement!(
      time: DateTime.new(2018,8,20,11,16,44),
      latitude: BigDecimal.new("40.68038924"),
      longitude: BigDecimal.new("-73.97631499"),
      value: 77.0,
      milliseconds: 234,
      stream: stream
    )

    zip_path = @subject.call([session.id])

		Zip::File.open(zip_path) do |zip_file|
      actual_contents = zip_file.entries.map { |entry| entry.get_input_stream.read }
      actual_filenames = zip_file.entries.map(&:name).join(", ")

      expected_filename = /^example_session_#{session.id}__.*\.csv$/
      expect(actual_filenames).to match(expected_filename)

      expected_contents = [File.read("#{Rails.root}/spec/support/session_stream_measurement.csv")]
      expect(actual_contents).to eq(expected_contents)
		end
	end

  private

  def create_session!(attributes)
    Session.create!(
      title: attributes[:title],
      user: User.new,
      uuid: "845342a6-f9f4-4835-86b3-b100163ec39a",
      calibration: 100,
      start_time: DateTime.current,
      start_time_local: DateTime.current,
      end_time: DateTime.current,
      end_time_local: DateTime.current,
      type: "MobileSession"
    )
  end

  def create_stream!(attributes)
    Stream.create!(
      sensor_package_name: attributes[:sensor_package_name],
      sensor_name: attributes[:sensor_name],
      measurement_type: attributes[:measurement_type],
      unit_name: attributes[:unit_name],
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

  def create_measurement!(attributes)
    Measurement.create!(
      time: attributes.fetch(:time),
      latitude: attributes.fetch(:latitude),
      longitude: attributes.fetch(:longitude),
      value: attributes.fetch(:value),
      milliseconds: attributes.fetch(:milliseconds),
      stream: attributes.fetch(:stream)
    )
  end
end
