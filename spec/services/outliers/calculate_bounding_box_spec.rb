require "spec_helper"

describe Outliers::CalculateBoundingBox do
  it "when measurements is an empty array it returns a bounding box of nils" do
    measurements = []

    actual = Outliers::CalculateBoundingBox.new.call(measurements)

    expected = {
      min_latitude: nil,
      max_latitude: nil,
      min_longitude: nil,
      max_longitude: nil
    }
    expect(actual).to eq(expected)
  end

  it "delegates to other services" do
    centroid = [one, one]
    measurements = [Measurement.new]
    bounding_boxes = { with_outliers: { a: 1 }, without_outliers: { b: 2 } }
    bounding_box = bounding_boxes.fetch(:without_outliers)
    calculate_centroid = double
    calculate_centroid.should_receive(:call).with(measurements) { centroid }
    calculate_bounding_boxes = double
    calculate_bounding_boxes.should_receive(:call).with(centroid, measurements) { bounding_boxes }
    select_bounding_box = double
    select_bounding_box.should_receive(:call).with(measurements.size, bounding_boxes) { bounding_box }

    actual = Outliers::CalculateBoundingBox
      .new(calculate_centroid, calculate_bounding_boxes, select_bounding_box)
      .call(measurements)

    expect(actual).to eq(bounding_box)
  end

  private

  def one
    @one ||= "1".to_d
  end
end
