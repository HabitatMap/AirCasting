require 'rails_helper'

describe Outliers::SelectBoundingBox do
  it 'when number of outliers is below the threshold the bounding box without outliers is returned' do
    bounding_boxes = {
      with_outliers: {
        a: 1
      },
      without_outliers: {
        b: 2
      },
      number_of_outliers: 4
    }
    number_of_measurements = 100
    threshold = 0.05

    actual =
      Outliers::SelectBoundingBox
        .new(threshold)
        .call(number_of_measurements, bounding_boxes)

    expected = bounding_boxes.fetch(:without_outliers)
    expect(actual).to eq(expected)
  end

  it 'when number of outliers is equal to the threshold the bounding box without outliers is returned' do
    bounding_boxes = {
      with_outliers: {
        a: 1
      },
      without_outliers: {
        b: 2
      },
      number_of_outliers: 5
    }
    number_of_measurements = 100
    threshold = 0.05

    actual =
      Outliers::SelectBoundingBox
        .new(threshold)
        .call(number_of_measurements, bounding_boxes)

    expected = bounding_boxes.fetch(:without_outliers)
    expect(actual).to eq(expected)
  end

  it 'when number of outliers is above the threshold the bounding box with outliers is returned' do
    bounding_boxes = {
      with_outliers: {
        a: 1
      },
      without_outliers: {
        b: 2
      },
      number_of_outliers: 6
    }
    number_of_measurements = 100
    threshold = 0.05

    actual =
      Outliers::SelectBoundingBox
        .new(threshold)
        .call(number_of_measurements, bounding_boxes)

    expected = bounding_boxes.fetch(:with_outliers)
    expect(actual).to eq(expected)
  end
end
