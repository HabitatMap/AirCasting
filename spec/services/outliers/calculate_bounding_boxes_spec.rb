require 'rails_helper'

describe Outliers::CalculateBoundingBoxes do
  it 'calculates bounding box with and without outliers' do
    non_outlier = Measurement.new(longitude: one, latitude: one)
    outlier = Measurement.new(longitude: two, latitude: two)
    measurements = [non_outlier, outlier]
    centroid = [one, one]
    max_distance = 0.001
    subject = Outliers::CalculateBoundingBoxes.new(max_distance)

    actual = subject.call(centroid, measurements)

    expected = {
      number_of_outliers: 1,
      with_outliers: {
        min_latitude: one,
        max_latitude: two,
        min_longitude: one,
        max_longitude: two
      },
      without_outliers: {
        min_latitude: one,
        max_latitude: one,
        min_longitude: one,
        max_longitude: one
      }
    }
    expect(actual).to eq(expected)
  end

  it 'with multiple measurements it calculates bounding box with and without outliers' do
    non_outlier1 = Measurement.new(longitude: two, latitude: two)
    non_outlier2 = Measurement.new(longitude: three, latitude: three)
    outlier1 = Measurement.new(longitude: one, latitude: one)
    outlier2 = Measurement.new(longitude: four, latitude: four)
    measurements = [non_outlier1, non_outlier2, outlier1, outlier2]
    centroid = [two_point_five, two_point_five]
    max_distance = 1
    subject = Outliers::CalculateBoundingBoxes.new(max_distance)

    actual = subject.call(centroid, measurements)

    expected = {
      number_of_outliers: 2,
      with_outliers: {
        min_latitude: one,
        max_latitude: four,
        min_longitude: one,
        max_longitude: four
      },
      without_outliers: {
        min_latitude: two,
        max_latitude: three,
        min_longitude: two,
        max_longitude: three
      }
    }
    expect(actual).to eq(expected)
  end

  private

  def one
    @one ||= '1'.to_d
  end

  def two
    @two ||= '2'.to_d
  end

  def two_point_five
    @two_point_five ||= '2.5'.to_d
  end

  def three
    @three ||= '3'.to_d
  end

  def four
    @four ||= '4'.to_d
  end
end
