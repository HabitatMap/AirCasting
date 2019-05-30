require "rails_helper"

describe Api::MeasurementsController do
  context "without pagination" do
    describe "#index" do
      it "returns measurements json" do
        user = create_user!
        session = create_session!(user: user)
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
        session = create_session!(user: user)
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
end
