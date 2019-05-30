require "rails_helper"

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
    expect(calculate_bounding_box).to receive(:call) {
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

  describe "#add_start_coordinates!" do
    it "assigns start longitude and latitude to stream based on first measurement" do
      stream = create_stream!
      create_measurement!({
        time: Time.utc(2018, 12, 1),
        latitude: 11,
        longitude: 12,
        stream: stream
      })
      create_measurement!({
        time: Time.utc(2018, 12, 2),
        latitude: 21,
        longitude: 22,
        stream: stream
      })

      subject.add_start_coordinates!(stream)

      expect(Stream.first.start_latitude).to eq(11)
      expect(Stream.first.start_longitude).to eq(12)
    end
  end
end
