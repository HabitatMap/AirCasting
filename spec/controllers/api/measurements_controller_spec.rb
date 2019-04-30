require "rails_helper"

describe Api::MeasurementsController do
  context "without pagination" do
    describe "#index" do
      it "returns measurements json" do
        user = create_user!
        session = create_mobile_session!(user: user)
        stream = create_stream!(session: session)
        time = DateTime.new(2000, 10, 1, 2, 3, 4)
        latitude = 1.1
        longitude = 2.2
        value = 1.0
        create_measurement!(stream: stream, value: value, latitude: latitude, longitude: longitude, time: time)

        get :index, stream_id: stream.id

        expected = [{
          "latitude" => latitude,
          "longitude" => longitude,
          "time" => "2000-10-01T02:03:04Z",
          "value" => value
        }]

        expect(json_response).to eq(expected)
      end
    end
  end

  context "with pagination" do
    describe "#index" do
      it "returns a page of measurements in json" do
        user = create_user!
        session = create_mobile_session!(user: user)
        stream = create_stream!(session: session)
        time = DateTime.new(2000, 10, 1, 2, 3, 4)
        latitude = 1.1
        longitude = 2.2
        value = 1.0
        create_measurement!(stream: stream, value: value - 2, latitude: latitude - 2, longitude: longitude - 2, time: time - 2)
        create_measurement!(stream: stream, value: value, latitude: latitude, longitude: longitude, time: time)
        create_measurement!(stream: stream, value: value + 2, latitude: latitude + 2, longitude: longitude + 2, time: time + 2)

        get :index, stream_id: stream.id, start_time: (time - 1).to_datetime.strftime("%Q").to_i, end_time: (time + 1).to_datetime.strftime("%Q").to_i

        expected = [{
          "latitude" => latitude,
          "longitude" => longitude,
          "time" => "2000-10-01T02:03:04Z",
          "value" => value
        }]

        expect(json_response).to eq(expected)
      end
    end
  end

  private

  def create_user!
    User.create!(
      username: "username",
      email: "email@example.com",
      password: "password"
    )
  end

  def create_mobile_session!(user:)
    MobileSession.create!(
      title: "title",
      user: user,
      uuid: SecureRandom.uuid,
      calibration: 100,
      offset_60_db: 0,
      start_time: DateTime.current,
      start_time_local: DateTime.current,
      end_time: DateTime.current,
      end_time_local: DateTime.current,
    )
  end

  def create_stream!(session:)
    Stream.create!(
      sensor_package_name: "abc",
      sensor_name: "sensor name",
      measurement_type: "abc",
      unit_name: "abc",
      session: session,
      measurement_short_type: "dB",
      unit_symbol: "dB",
      threshold_very_low: 20,
      threshold_low: 60,
      threshold_medium: 70,
      threshold_high: 80,
      threshold_very_high: 100
    )
  end

  def create_measurement!(stream:, value:, latitude:, longitude:, time:)
    Measurement.create!(
      time: time,
      latitude: latitude,
      longitude: longitude,
      value: value,
      milliseconds: 123,
      stream: stream
    )
  end
end
