require "spec_helper"

describe Outliers::FilterMeasurementsFartherThan do
  it "filters all measurement that are farther than max_distance from centroid" do
    m1 = Measurement.new(
      longitude: one,
      latitude: one,
    )
    m2 = Measurement.new(
      longitude: two,
      latitude: two,
    )
    measurements = [m1, m2]
    centroid = [one, one]
    max_distance = 0.001
    subject = Outliers::FilterMeasurementsFartherThan.new(max_distance, 100)

    actual = subject.call(centroid, measurements)

    expected = [m1]
    expect(actual).to eq(expected)
  end

  it "when outliers found are above the threshold then measurements are not filtered" do
    m1 = Measurement.new(
      longitude: one,
      latitude: one,
    )
    m2 = Measurement.new(
      longitude: two,
      latitude: two,
    )
    measurements = [m1, m2]
    centroid = [one, one]
    max_distance = 0.001
    threshold = 0.49
    subject = Outliers::FilterMeasurementsFartherThan.new(max_distance, threshold)

    actual = subject.call(centroid, measurements)

    expected = measurements
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
