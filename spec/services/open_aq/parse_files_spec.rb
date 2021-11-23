require 'rails_helper'

describe OpenAq::ParseFiles do
  it 'parses files into measurements' do
    measurements1 = [build_open_aq_measurement, build_open_aq_measurement]
    measurements2 = [build_open_aq_measurement, build_open_aq_measurement]
    files = [build_file(measurements1), build_file(measurements2)]

    actual = subject.call(files: files)

    expect(actual).to eq(measurements1 + measurements2)
  end

  it 'filters out measurements with no coordinates' do
    files = [build_file_with_no_coordinates]

    actual = subject.call(files: files)

    expect(actual).to eq([])
  end

  it 'rounds latitude and longitude to 9 decimal digits' do
    ten_decimal_digits = BigDecimal('0.1234567891')
    measurement =
      build_open_aq_measurement(
        latitude: ten_decimal_digits,
        longitude: ten_decimal_digits
      )
    files = [build_file([measurement])]

    actual = subject.call(files: files)

    nine_decimal_digits = BigDecimal('0.123456789')
    expect(actual.map(&:latitude)).to eq([nine_decimal_digits])
    expect(actual.map(&:longitude)).to eq([nine_decimal_digits])
  end

  it 'filters out invalid JSON lines' do
    measurement1 = build_open_aq_measurement
    measurement2 = build_open_aq_measurement
    file =
      [
        build_line(measurement1).to_json,
        build_line(build_open_aq_measurement).to_json[0..-10],
        build_line(measurement2).to_json
      ].shuffle.join("\n")

    actual = subject.call(files: [file])

    expect(actual).to match_array([measurement1, measurement2])
  end

  private

  def build_file(measurements)
    build_lines(measurements).map(&:to_json).join("\n")
  end

  def build_file_with_no_coordinates
    build_lines([build_open_aq_measurement])
      .map { |hash| hash.filter { |k, v| k == 'coordinates' } }
      .map(&:to_json)
      .join("\n")
  end

  def build_lines(measurements)
    measurements.map { |measurement| build_line(measurement) }
  end

  def build_line(measurement)
    {
      'date': {
        'utc': measurement.time_utc,
        'local': measurement.time_local
      },
      'parameter': measurement.sensor_name,
      'value': measurement.value,
      'unit': measurement.unit,
      'location': measurement.location,
      'city': measurement.city,
      'country': measurement.country,
      'coordinates': {
        'latitude': measurement.latitude,
        'longitude': measurement.longitude
      }
    }
  end
end
