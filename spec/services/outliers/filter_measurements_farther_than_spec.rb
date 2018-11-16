require "spec_helper"

describe Outliers::FilterMeasurementsFartherThan do
  it "filters all measurement that are farther than max_distance from centroid" do
    m1 = m2 = Measurement.new(
      longitude: one,
      latitude: one,
    )
    m3 = Measurement.new(
      longitude: two,
      latitude: two,
    )
    measurements = [m1, m2, m3]
    centroid = [one, one]
    max_distance = 0.001
    subject = Outliers::FilterMeasurementsFartherThan.new(max_distance)

    actual = subject.call(centroid, measurements)

    expected = [m1, m2]
    expect(actual).to eq(expected)
  end

  private

  def one
    @one ||= "1".to_d
  end

  def two
    @two ||= "2".to_d
  end
end
