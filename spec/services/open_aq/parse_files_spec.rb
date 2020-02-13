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

  private

  def build_file(measurements)
    build_lines(measurements).map(&:to_json).join("\n")
  end

  def build_file_with_no_coordinates
    build_lines([build_open_aq_measurement]).map do |hash|
      hash.filter { |k, v| k == 'coordinates' }
    end.map(&:to_json)
      .join("\n")
  end

  def build_lines(measurements)
    measurements.map do |measurement|
      {
        "date": {
          "utc": measurement.time_utc, "local": measurement.time_local
        },
        "parameter": measurement.sensor_name,
        "value": measurement.value,
        "unit": measurement.unit,
        "location": measurement.location,
        "city": measurement.city,
        "country": measurement.country,
        "coordinates": {
          "latitude": measurement.latitude, "longitude": measurement.longitude
        }
      }
    end
  end
end
