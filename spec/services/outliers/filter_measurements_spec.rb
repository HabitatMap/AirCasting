require "spec_helper"

describe Outliers::FilterMeasurements do
  it "filters measurement outliers" do
    max_distance = 1

    calculate_centroid = lambda { |_| [one, one] }

    calculate_distance = lambda do |lng_lat1, lng_lat2|
      if (lng_lat1 == [one_thousand, one_thousand] || lng_lat2 == [one_thousand, one_thousand])
        max_distance + 1
      else
        max_distance
      end
    end

    subject = Outliers::FilterMeasurements.new(max_distance, calculate_centroid, calculate_distance)

    m1 = Measurement.new(
      longitude: one,
      latitude: one,
    )

    m2 = Measurement.new(
      longitude: one,
      latitude: one,
    )

    m3 = Measurement.new(
      longitude: one_thousand,
      latitude: one_thousand,
    )

    measurements = [m1, m2, m3]


    actual = subject.call(measurements)


    expected = [m1, m2]
    expect(actual).to eq(expected)
  end

  private

  def one
    @one ||= "1".to_d
  end

  def one_thousand
    @one_thousand ||= "1000".to_d
  end
end
