require "rails_helper"

describe Api::Mobile::SessionsController do
  describe "#index" do
    it "returns sessions json" do
      user = create_user!
      session_time = DateTime.new(2000, 10, 1, 2, 3, 4)
      session = create_mobile_session!(
        user: user,
        start_time_local: session_time,
        end_time_local: session_time
      )
      stream = create_stream!(
        session: session,
        latitude: session.latitude,
        longitude: session.longitude
      )
      measurement = create_measurement!(stream: stream)

      get :index, q: {
        time_from: session_time.to_datetime.strftime("%Q").to_i / 1000 - 1,
        time_to: session_time.to_datetime.strftime("%Q").to_i / 1000 + 1,
        tags: "",
        usernames: "",
        session_ids: [],
        west: session.longitude - 1,
        east: session.longitude + 1,
        south: session.latitude - 1,
        north: session.latitude + 1,
        limit: 1,
        offset: 0,
        sensor_name: stream.sensor_name,
        measurement_type: stream.measurement_type,
        unit_symbol: stream.unit_symbol
      }.to_json

      expected = {
        "fetchableSessionsCount" => 1,
        "sessions" => [
          "average" => measurement.value,
          "end_time_local" => "2000-10-01T02:03:04.000Z",
          "start_time_local" => "2000-10-01T02:03:04.000Z",
          "id" => session.id,
          "title" => session.title,
          "type" => session.type,
          "username" => user.username,
          "streams" => {
            stream.sensor_name => {
              "average_value" => stream.average_value,
              "id" => stream.id,
              "max_latitude" => stream.max_latitude,
              "max_longitude" => stream.max_longitude,
              "measurement_short_type" => stream.measurement_short_type,
              "measurement_type" => stream.measurement_type,
              "measurements_count" => 1,
              "min_latitude" => stream.min_latitude,
              "min_longitude" => stream.min_longitude,
              "sensor_name" => stream.sensor_name,
              "sensor_package_name" => stream.sensor_package_name,
              "session_id" => session.id,
              "size" => 1,
              "start_latitude" => stream.start_latitude,
              "start_longitude" => stream.start_longitude,
              "threshold_high" => stream.threshold_high,
              "threshold_low" => stream.threshold_low,
              "threshold_medium" => stream.threshold_medium,
              "threshold_very_high" => stream.threshold_very_high,
              "threshold_very_low" => stream.threshold_very_low,
              "unit_name" => stream.unit_name,
              "unit_symbol" => stream.unit_symbol
            }
          }
        ]
      }
      expect(json_response).to eq(expected)
    end
  end

  describe "#show" do
    it "returns session json" do
      start_time_local = DateTime.new(2000, 10, 1, 2, 3)
      end_time_local = DateTime.new(2001, 11, 4, 5, 6)
      sensor_name = "sensor-name"
      user = create_user!
      session = create_mobile_session!(user: user, start_time_local: start_time_local, end_time_local: end_time_local)
      create_stream!(session: session, sensor_name: "another-sensor-name")
      stream = create_stream!(session: session, sensor_name: sensor_name)
      create_stream!(session: session, sensor_name: "yet another-sensor-name")
      measurement1 = create_measurement!(stream: stream)
      measurement2 = create_measurement!(stream: stream)

      get :show, id: session.id, sensor_name: sensor_name

      expected = {
        "title" => session.title,
        "username" => user.username,
        "sensorName" => sensor_name,
        "average" => (measurement1.value + measurement2.value) / 2,
        "measurements" => [measurement1.value, measurement2.value],
        "startTime" => 970365780000,
        "endTime" => 1004850360000,
        "id" => session.id,
        "streamId" => stream.id,
      }
      expect(json_response).to eq(expected)
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

  def create_mobile_session!(user:, start_time_local:, end_time_local:)
    MobileSession.create!(
      title: "title",
      user: user,
      uuid: SecureRandom.uuid,
      calibration: 100,
      offset_60_db: 0,
      start_time: DateTime.current,
      start_time_local: start_time_local,
      end_time: DateTime.current,
      end_time_local: end_time_local,
      latitude: 123,
      longitude: 123,
      contribute: true
    )
  end

  def create_stream!(session:, sensor_name: "sensor_name", latitude: 123, longitude: 123)
    Stream.create!(
      sensor_package_name: "abc",
      sensor_name: sensor_name,
      measurement_type: "abc",
      unit_name: "abc",
      session: session,
      measurement_short_type: "dB",
      unit_symbol: "dB",
      threshold_very_low: 20,
      threshold_low: 60,
      threshold_medium: 70,
      threshold_high: 80,
      threshold_very_high: 100,
      start_latitude: 123,
      start_longitude: 123,
      average_value: 1.23,
      min_latitude: latitude,
      max_latitude: latitude,
      min_longitude: longitude,
      max_longitude: longitude
    )
  end

  def create_measurement!(stream:)
    Measurement.create!(
      time: DateTime.current,
      latitude: 123,
      longitude: 123,
      value: 1.0,
      milliseconds: 123,
      stream: stream
    )
  end
end
