require "rails_helper"

describe Api::Fixed::SessionsController do
  describe "#show" do
    it "returns session json" do
      username = "username"
      title = "session title"
      start_time_local = DateTime.new(2000, 10, 1, 2, 3)
      end_time_local = DateTime.new(2001, 11, 4, 5, 6)
      sensor_name = "sensor-name"
      user = create_user!(username: username)
      session = create_fixed_session!(user: user, title: title, start_time_local: start_time_local, end_time_local: end_time_local)
      create_stream!(session: session, sensor_name: "another-sensor-name")
      stream = create_stream!(session: session, sensor_name: sensor_name)
      create_stream!(session: session, sensor_name: "yet another-sensor-name")
      value1 = 1.0
      create_measurement!(stream: stream, sensor_name: sensor_name, value: value1)
      value2 = 2.0
      create_measurement!(stream: stream, sensor_name: sensor_name, value: value2)

      get :show, id: session.id, sensor_name: sensor_name

      expected = {
        "title" => title,
        "username" => username,
        "sensor_name" => sensor_name,
        "average" => 1.5,
        "measurements" => [value1, value2],
        "startTime" => "01/10/2000, 02:03",
        "endTime" => "04/11/2001, 05:06",
        "id" => session.id,
      }
      expect(json_response).to eq(expected)
    end
  end

  private

  def create_user!(username:)
    User.create!(
      username: username,
      email: "email@example.com",
      password: "password"
    )
  end

  def create_fixed_session!(user:, title:, start_time_local:, end_time_local:)
    FixedSession.create!(
      title: title,
      user: user,
      uuid: SecureRandom.uuid,
      calibration: 100,
      offset_60_db: 0,
      start_time: DateTime.current,
      start_time_local: start_time_local,
      end_time: DateTime.current,
      end_time_local: end_time_local,
      is_indoor: false,
      latitude: 123,
      longitude: 123
    )
  end

  def create_stream!(session:, sensor_name:)
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
      threshold_very_high: 100
    )
  end

  def create_measurement!(stream:, sensor_name:, value:)
    Measurement.create!(
      time: DateTime.current,
      latitude: 123,
      longitude: 123,
      value: value,
      milliseconds: 123,
      stream: stream
    )
  end
end
