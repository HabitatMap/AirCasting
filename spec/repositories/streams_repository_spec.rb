require 'rails_helper'

describe StreamsRepository do
  subject { described_class.new }

  describe '#find_fixed_stream!' do
    it 'returns stream with associated session and user' do
      fixed_session = create_fixed_session!
      fixed_stream = create_stream!({ session: fixed_session })
      create_stream!

      result = subject.find_fixed_stream!(id: fixed_stream.id)

      expect(result).to eq(fixed_stream)
      expect(result.association(:session).loaded?).to eq(true)
      expect(result.session.association(:user).loaded?).to eq(true)
    end
  end

  describe '#find_by_session_uuid_and_sensor_name' do
    it 'returns streams matching session uuid and sensor name' do
      session = create_fixed_session!(uuid: 'test-uuid')
      matching_stream =
        create_stream!(session: session, sensor_name: 'sensor-1')

      other_session = create_fixed_session!(uuid: 'other-uuid')
      create_stream!(session: other_session, sensor_name: 'sensor-1')
      create_stream!(session: session, sensor_name: 'sensor-2')

      result =
        subject.find_by_session_uuid_and_sensor_name(
          session_uuid: 'test-uuid',
          sensor_name: 'sensor-1',
        )

      expect(result).to eq(matching_stream)
    end
  end

  it '#calculate_bounding_box! recalculates the bounding box and saves to database' do
    stream =
      create_stream!(
        {
          min_latitude: 1,
          max_latitude: 2,
          min_longitude: 3,
          max_longitude: 4,
        },
      )

    create_measurement!({ latitude: 6, longitude: 7, stream: stream })

    create_measurement!({ latitude: 5, longitude: 8, stream: stream })

    calculate_bounding_box = double
    expect(calculate_bounding_box).to receive(:call) {
      { min_latitude: 5, max_latitude: 6, min_longitude: 7, max_longitude: 8 }
    }

    StreamsRepository.new.calculate_bounding_box!(
      stream,
      calculate_bounding_box,
    )
    actual = StreamsRepository.new.find(stream.id)

    expect(actual.min_latitude).to eq(5)
    expect(actual.max_latitude).to eq(6)
    expect(actual.min_longitude).to eq(7)
    expect(actual.max_longitude).to eq(8)
  end

  describe '#add_start_coordinates!' do
    it 'assigns start longitude and latitude to stream based on first measurement' do
      stream = create_stream!
      create_measurement!(
        {
          time: Time.utc(2_018, 12, 1),
          latitude: 11,
          longitude: 12,
          stream: stream,
        },
      )
      create_measurement!(
        {
          time: Time.utc(2_018, 12, 2),
          latitude: 21,
          longitude: 22,
          stream: stream,
        },
      )

      subject.add_start_coordinates!(stream)

      expect(Stream.first.start_latitude).to eq(11)
      expect(Stream.first.start_longitude).to eq(12)
    end
  end
end
