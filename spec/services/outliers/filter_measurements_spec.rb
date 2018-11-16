require "spec_helper"

describe Outliers::FilterMeasurements do
  it "when measurements is an empty array it returns it" do
    measurements = []

    actual = Outliers::FilterMeasurements.new.call(measurements)

    expect(actual).to eq(measurements)
  end

  it "asks for the centroid and delegates to filter" do
    centroid = [one, one]
    measurements = [Measurement.new]
    calculate_centroid = lambda { |_| centroid }
    filter = double()
    filter.should_receive(:call).with(centroid, measurements) { measurements }

    actual = Outliers::FilterMeasurements.new(calculate_centroid, filter).call(measurements)

    expect(actual).to eq(measurements)
  end

  private

  def one
    @one ||= "1".to_d
  end
end
