require 'rails_helper'

describe Csv::AppendMeasurementsContent do
  before(:each) { @subject = Csv::AppendMeasurementsContent.new }

  it 'with one stream with one measurement appends the correct measurement column' do
    amount_of_streams = 1
    measurement_value = 76.0
    sensor_name = 'AirBeam2-F'
    measurements = [
      build_measurement(
        'measurement_value' => measurement_value,
        'stream_sensor_name' => sensor_name
      )
    ]
    sensor_package_name = 'AirBeam2:00189610719F'
    measurement_type = 'Temperature'
    measurement_units = 'Fahrenheit'
    stream_parameters =
      build_stream_parameters(
        'sensor_names' => [sensor_name],
        'measurement_types' => [measurement_type],
        'measurement_units' => [measurement_units]
      )
    data =
      build_data(
        amount_of_streams,
        measurements,
        sensor_package_name,
        123,
        stream_parameters
      )
    lines = []

    result = @subject.call(lines, data)

    expect(lines[0].drop(5)).to eq(%w[Sensor_Package_Name])
    expect(lines[1].drop(5)).to eq([sensor_package_name])
    expect(lines[2].drop(5)).to eq(%w[Sensor_Name])
    expect(lines[3].drop(5)).to eq([sensor_name])
    expect(lines[4].drop(5)).to eq(%w[Measurement_Type])
    expect(lines[5].drop(5)).to eq([measurement_type])
    expect(lines[6].drop(5)).to eq(%w[Measurement_Units])
    expect(lines[7].drop(5)).to eq([measurement_units])
    expect(lines[8].drop(5)).to eq(%w[1:Measurement_Value])
    expect(lines[9].drop(5)).to eq([measurement_value])
  end

  it 'with one stream with no measurements appends nine lines' do
    amount_of_streams = 1
    measurements = []
    data =
      build_data(
        amount_of_streams,
        measurements,
        'abc',
        123,
        build_stream_parameters
      )
    lines = []

    result = @subject.call(lines, data)

    expect(lines.size).to eq(9)
  end

  it 'with one stream and one measurement appends ten lines' do
    amount_of_streams = 1
    sensor_name = 'AirBeam2-F'
    measurements = [build_measurement('stream_sensor_name' => sensor_name)]
    stream_parameters = build_stream_parameters('sensor_names' => [sensor_name])
    data =
      build_data(amount_of_streams, measurements, 'abc', 123, stream_parameters)
    lines = []

    result = @subject.call(lines, data)

    expect(lines.size).to eq(10)
  end

  it 'with one stream and two measurements appends the correct two measurement lines' do
    amount_of_streams = 1
    session_title = 'Example Session'
    sensor_name = 'AirBeam2-F'
    milliseconds_1 = 111
    milliseconds_2 = 222
    measurement_timestamp_1 = "2018-08-20T14:13:51.#{milliseconds_1}"
    measurement_timestamp_2 = "2019-09-21T15:14:52.#{milliseconds_2}"
    latitude_1 = BigDecimal('1.1')
    latitude_2 = BigDecimal('1.2')
    longitude_1 = BigDecimal('2.1')
    longitude_2 = BigDecimal('2.2')
    measurement_value_1 = 77.0
    measurement_value_2 = 76.0

    measurements = [
      build_measurement(
        'measurement_time' => Time.new(2_018, 8, 20, 14, 13, 51),
        'measurement_milliseconds' => milliseconds_1,
        'measurement_latitude' => latitude_1,
        'measurement_longitude' => longitude_1,
        'measurement_value' => measurement_value_1,
        'stream_sensor_name' => sensor_name,
        'session_title' => session_title
      ),
      build_measurement(
        'measurement_time' => Time.new(2_019, 9, 21, 15, 14, 52),
        'measurement_milliseconds' => milliseconds_2,
        'measurement_latitude' => latitude_2,
        'measurement_longitude' => longitude_2,
        'measurement_value' => measurement_value_2,
        'stream_sensor_name' => sensor_name,
        'session_title' => session_title
      )
    ]

    stream_parameters = build_stream_parameters('sensor_names' => [sensor_name])
    data =
      build_data(amount_of_streams, measurements, 'abc', 123, stream_parameters)
    lines = []

    result = @subject.call(lines, data)

    expected_1 = [
      1,
      session_title,
      measurement_timestamp_1,
      latitude_1,
      longitude_1,
      measurement_value_1
    ]
    expected_2 = [
      2,
      session_title,
      measurement_timestamp_2,
      latitude_2,
      longitude_2,
      measurement_value_2
    ]
    expect(lines[-2]).to eq(expected_1)
    expect(lines[-1]).to eq(expected_2)
  end

  it 'with one stream and two measurements with the same timestamp and coordinates it ignores all but the first value' do
    amount_of_streams = 1
    session_title = 'Example Session'
    sensor_name = 'AirBeam2-F'
    milliseconds = 111
    measurement_timestamp = "2018-08-20T14:13:51.#{milliseconds}"
    latitude = BigDecimal('1.1')
    longitude = BigDecimal('2.2')
    measurement_value_1 = 77.0
    measurement_value_2 = 76.0
    measurement_time = Time.new(2_018, 8, 20, 14, 13, 51)

    measurements = [
      build_measurement(
        'measurement_time' => measurement_time,
        'measurement_milliseconds' => milliseconds,
        'measurement_latitude' => latitude,
        'measurement_longitude' => longitude,
        'measurement_value' => measurement_value_1,
        'stream_sensor_name' => sensor_name,
        'session_title' => session_title
      ),
      build_measurement(
        'measurement_time' => measurement_time,
        'measurement_milliseconds' => milliseconds,
        'measurement_latitude' => latitude,
        'measurement_longitude' => longitude,
        'measurement_value' => measurement_value_2,
        'stream_sensor_name' => sensor_name,
        'session_title' => session_title
      )
    ]

    stream_parameters = build_stream_parameters('sensor_names' => [sensor_name])
    data =
      build_data(amount_of_streams, measurements, 'abc', 123, stream_parameters)
    lines = []

    result = @subject.call(lines, data)

    expected = [
      1,
      session_title,
      measurement_timestamp,
      latitude,
      longitude,
      measurement_value_1
    ]
    expect(lines[-1]).to eq(expected)
  end

  it 'with two streams appends the headers for two stream' do
    amount_of_streams = 2
    data =
      build_data(amount_of_streams, [], 'abc', 123, build_stream_parameters)
    lines = []

    result = @subject.call(lines, data)

    expect(lines[0].drop(5)).to eq(%w[Sensor_Package_Name] * 2)
    expect(lines[2].drop(5)).to eq(%w[Sensor_Name] * 2)
    expect(lines[4].drop(5)).to eq(%w[Measurement_Type] * 2)
    expect(lines[6].drop(5)).to eq(%w[Measurement_Units] * 2)
    expect(lines[8].drop(5)).to eq(%w[1:Measurement_Value 2:Measurement_Value])
  end

  it 'with two streams appends the correct sensor package names in the second line' do
    amount_of_streams = 2
    sensor_package_name = 'AirBeam2:00189610719F'
    data =
      build_data(
        amount_of_streams,
        [],
        sensor_package_name,
        123,
        build_stream_parameters
      )
    lines = []

    result = @subject.call(lines, data)

    expect(lines[1].drop(5)).to eq([sensor_package_name] * 2)
  end

  it 'with two streams appends the correct sensor names in the fourth line' do
    amount_of_streams = 2
    sensor_name_1 = 'AirBeam2-F'
    sensor_name_2 = 'AirBeam2-PM1'
    stream_parameters =
      build_stream_parameters('sensor_names' => [sensor_name_1, sensor_name_2])
    data = build_data(amount_of_streams, [], 'abc', 123, stream_parameters)
    lines = []

    result = @subject.call(lines, data)

    expect(lines[3].drop(5)).to eq([sensor_name_1, sensor_name_2])
  end

  it 'with two streams appends the correct measurement types in the sixth line' do
    amount_of_streams = 2
    measurement_type_1 = 'Particulate Matter'
    measurement_type_2 = 'Temperature'
    stream_parameters =
      build_stream_parameters(
        'measurement_types' => [measurement_type_1, measurement_type_2]
      )
    data = build_data(amount_of_streams, [], 'abc', 123, stream_parameters)
    lines = []

    result = @subject.call(lines, data)

    expect(lines[5].drop(5)).to eq([measurement_type_1, measurement_type_2])
  end

  it 'with two streams appends the correct measurement units in the eighth line' do
    amount_of_streams = 2
    measurement_units_1 = 'micrograms per cubic meter'
    measurement_units_2 = 'Fahrenheit'
    stream_parameters =
      build_stream_parameters(
        'measurement_units' => [measurement_units_1, measurement_units_2]
      )
    data = build_data(amount_of_streams, [], 'abc', 123, stream_parameters)
    lines = []

    result = @subject.call(lines, data)

    expect(lines[7].drop(5)).to eq([measurement_units_1, measurement_units_2])
  end

  it 'with two streams with two measurements with different sensor names but same timestamp and coordinates appends the correct single measurement line' do
    amount_of_streams = 2

    time = Time.new(2_018, 8, 20, 14, 13, 51)
    milliseconds = 111
    measurement_timestamp = "2018-08-20T14:13:51.#{milliseconds}"
    latitude = BigDecimal('1.1')
    longitude = BigDecimal('2.2')
    measurement_value_1 = 77.0
    measurement_value_2 = 76.0
    session_title = 'Example Session'
    sensor_name_1 = 'AirBeam2-F'
    sensor_name_2 = 'AirBeam2-RH'

    measurements = [
      {
        'measurement_time' => time,
        'measurement_milliseconds' => milliseconds,
        'measurement_latitude' => latitude,
        'measurement_longitude' => longitude,
        'measurement_value' => measurement_value_1,
        'stream_sensor_name' => sensor_name_1,
        'session_title' => session_title
      },
      {
        'measurement_time' => time,
        'measurement_milliseconds' => milliseconds,
        'measurement_latitude' => latitude,
        'measurement_longitude' => longitude,
        'measurement_value' => measurement_value_2,
        'stream_sensor_name' => sensor_name_2,
        'session_title' => session_title
      }
    ]

    stream_parameters =
      build_stream_parameters('sensor_names' => [sensor_name_1, sensor_name_2])

    data =
      build_data(amount_of_streams, measurements, 'abc', 123, stream_parameters)
    lines = []

    result = @subject.call(lines, data)

    expected = [
      1,
      session_title,
      measurement_timestamp,
      latitude,
      longitude,
      measurement_value_1,
      measurement_value_2
    ]
    expect(lines[-1]).to eq(expected)
  end

  it 'with two streams with two measurements with the same timestamp but different coordinates appends the correct two measurement lines' do
    amount_of_streams = 2

    sensor_name_1 = 'AirBeam2-F'
    sensor_name_2 = 'AirBeam2-PM1'
    stream_parameters =
      build_stream_parameters('sensor_names' => [sensor_name_1, sensor_name_2])
    session_title = 'Example Session'
    milliseconds = 111
    measurement_timestamp = "2018-08-20T14:13:51.#{milliseconds}"
    latitude_1 = BigDecimal('1.1')
    longitude_1 = BigDecimal('1.1')
    measurement_value_1 = 77.0
    time = Time.new(2_018, 8, 20, 14, 13, 51)
    measurement_value_2 = 76.0
    latitude_2 = BigDecimal('2.2')
    longitude_2 = BigDecimal('2.2')
    measurements = [
      {
        'measurement_time' => time,
        'measurement_milliseconds' => milliseconds,
        'measurement_latitude' => latitude_1,
        'measurement_longitude' => longitude_1,
        'measurement_value' => measurement_value_1,
        'stream_sensor_name' => sensor_name_1,
        'session_title' => session_title
      },
      {
        'measurement_time' => time,
        'measurement_milliseconds' => milliseconds,
        'measurement_latitude' => latitude_2,
        'measurement_longitude' => longitude_2,
        'measurement_value' => measurement_value_2,
        'stream_sensor_name' => sensor_name_2,
        'session_title' => session_title
      }
    ]

    data =
      build_data(amount_of_streams, measurements, 'abc', 123, stream_parameters)

    lines = []

    result = @subject.call(lines, data)

    expected_1 = [
      1,
      session_title,
      measurement_timestamp,
      latitude_1,
      longitude_1,
      measurement_value_1,
      nil
    ]
    expected_2 = [
      2,
      session_title,
      measurement_timestamp,
      latitude_2,
      longitude_2,
      nil,
      measurement_value_2
    ]

    expect(lines[-2]).to eq(expected_1)
    expect(lines[-1]).to eq(expected_2)
  end

  it 'with two streams with two measurements with different timestamps but same coordinates appends the correct two measurement lines' do
    amount_of_streams = 2

    sensor_name_1 = 'AirBeam2-F'
    sensor_name_2 = 'AirBeam2-PM1'
    stream_parameters =
      build_stream_parameters('sensor_names' => [sensor_name_1, sensor_name_2])
    session_title = 'Example Session'
    milliseconds_1 = 111
    measurement_timestamp_1 = "2018-08-20T14:13:51.#{milliseconds_1}"
    latitude = BigDecimal('1.2')
    longitude = BigDecimal('1.2')
    measurement_value_1 = 77.0
    time_1 = Time.new(2_018, 8, 20, 14, 13, 51)
    measurement_value_2 = 76.0
    milliseconds_2 = 222
    measurement_timestamp_2 = "2019-09-21T15:14:52.#{milliseconds_2}"
    time_2 = Time.new(2_019, 9, 21, 15, 14, 52)

    measurements = [
      {
        'measurement_time' => time_1,
        'measurement_milliseconds' => milliseconds_1,
        'measurement_latitude' => latitude,
        'measurement_longitude' => longitude,
        'measurement_value' => measurement_value_1,
        'stream_sensor_name' => sensor_name_1,
        'session_title' => session_title
      },
      {
        'measurement_time' => time_2,
        'measurement_milliseconds' => milliseconds_2,
        'measurement_latitude' => latitude,
        'measurement_longitude' => longitude,
        'measurement_value' => measurement_value_2,
        'stream_sensor_name' => sensor_name_2,
        'session_title' => session_title
      }
    ]

    data =
      build_data(amount_of_streams, measurements, 'abc', 123, stream_parameters)
    lines = []

    result = @subject.call(lines, data)

    expected_1 = [
      1,
      session_title,
      measurement_timestamp_1,
      latitude,
      longitude,
      measurement_value_1,
      nil
    ]
    expected_2 = [
      2,
      session_title,
      measurement_timestamp_2,
      latitude,
      longitude,
      nil,
      measurement_value_2
    ]

    expect(lines[-2]).to eq(expected_1)
    expect(lines[-1]).to eq(expected_2)
  end

  it 'with two streams with two measurements with different timestamps and different coordinates appends the correct content' do
    amount_of_streams = 2

    sensor_name_1 = 'AirBeam2-F'
    sensor_name_2 = 'AirBeam2-PM1'
    measurement_type_1 = 'Particulate Matter'
    measurement_type_2 = 'Temperature'
    measurement_units_1 = 'micrograms per cubic meter'
    measurement_units_2 = 'Fahrenheit'
    milliseconds_1 = 111
    milliseconds_2 = 222
    measurement_timestamp_1 = "2018-08-20T14:13:51.#{milliseconds_1}"
    measurement_timestamp_2 = "2019-09-21T15:14:52.#{milliseconds_2}"
    latitude_1 = BigDecimal('1.1')
    latitude_2 = BigDecimal('2.2')
    longitude_1 = BigDecimal('1.1')
    longitude_2 = BigDecimal('2.2')
    measurement_value_1 = 77.0
    measurement_value_2 = 76.0
    time_1 = Time.new(2_018, 8, 20, 14, 13, 51)
    time_2 = Time.new(2_019, 9, 21, 15, 14, 52)

    session_title = 'Example Session'

    measurements = [
      {
        'measurement_time' => time_1,
        'measurement_milliseconds' => milliseconds_1,
        'measurement_latitude' => latitude_1,
        'measurement_longitude' => longitude_1,
        'measurement_value' => measurement_value_1,
        'stream_sensor_name' => sensor_name_1,
        'session_title' => session_title
      },
      {
        'measurement_time' => time_2,
        'measurement_milliseconds' => milliseconds_2,
        'measurement_latitude' => latitude_2,
        'measurement_longitude' => longitude_2,
        'measurement_value' => measurement_value_2,
        'stream_sensor_name' => sensor_name_2,
        'session_title' => session_title
      }
    ]

    sensor_package_name = 'AirBeam2:00189610719F'
    stream_parameters =
      build_stream_parameters(
        'sensor_names' => [sensor_name_1, sensor_name_2],
        'measurement_types' => [measurement_type_1, measurement_type_2],
        'measurement_units' => [measurement_units_1, measurement_units_2]
      )

    data =
      build_data(
        amount_of_streams,
        measurements,
        sensor_package_name,
        123,
        stream_parameters
      )

    lines = []

    result = @subject.call(lines, data)

    expected = [
      [nil, nil, nil, nil, nil, 'Sensor_Package_Name', 'Sensor_Package_Name'],
      [nil, nil, nil, nil, nil, sensor_package_name, sensor_package_name],
      [nil, nil, nil, nil, nil, 'Sensor_Name', 'Sensor_Name'],
      [nil, nil, nil, nil, nil, sensor_name_1, sensor_name_2],
      [nil, nil, nil, nil, nil, 'Measurement_Type', 'Measurement_Type'],
      [nil, nil, nil, nil, nil, measurement_type_1, measurement_type_2],
      [nil, nil, nil, nil, nil, 'Measurement_Units', 'Measurement_Units'],
      [nil, nil, nil, nil, nil, measurement_units_1, measurement_units_2],
      %w[
        ObjectID
        Session_Name
        Timestamp
        Latitude
        Longitude
        1:Measurement_Value
        2:Measurement_Value
      ],
      [
        1,
        session_title,
        measurement_timestamp_1,
        latitude_1,
        longitude_1,
        measurement_value_1,
        nil
      ],
      [
        2,
        session_title,
        measurement_timestamp_2,
        latitude_2,
        longitude_2,
        nil,
        measurement_value_2
      ]
    ]

    expect(lines).to eq(expected)
  end

  private

  def build_data(
    amount_of_streams,
    measurements,
    sensor_package_name,
    session_id,
    stream_parameters
  )
    Csv::MeasurementsData.new(
      'amount_of_streams' => amount_of_streams,
      'measurements' => measurements,
      'sensor_package_name' => sensor_package_name,
      'session_id' => session_id,
      'stream_parameters' => stream_parameters
    )
  end

  def build_stream_parameters(attr = {})
    {
      'measurement_types' => attr.fetch('measurement_types', []),
      'measurement_units' => attr.fetch('measurement_units', []),
      'sensor_names' => attr.fetch('sensor_names', [])
    }
  end

  def build_measurement(attr = {})
    {
      'measurement_time' => attr.fetch('measurement_time', Time.current),
      'measurement_milliseconds' => attr.fetch('measurement_milliseconds', 123),
      'measurement_latitude' => attr.fetch('measurement_latitude', 123.4),
      'measurement_longitude' => attr.fetch('measurement_longitude', 123.4),
      'measurement_value' => attr.fetch('measurement_value', 123.4),
      'stream_sensor_name' => attr.fetch('stream_sensor_name', 'abc'),
      'session_title' => attr.fetch('session_title', 'abc')
    }
  end
end
