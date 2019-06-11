require 'rails_helper'

describe Outliers::CalculateDistance do
  before(:each) { @subject = Outliers::CalculateDistance.new }

  it 'when the points are the same it returns 0' do
    lng_lat = [one, one]

    actual = @subject.call(lng_lat, lng_lat)

    expect(actual).to eq(zero)
  end

  it 'it returns the distance 1' do
    lng_lat1 = [one, one]
    lng_lat2 = [one, two]

    actual = @subject.call(lng_lat1, lng_lat2)

    expect(actual).to eq(one)
  end

  it 'it returns the distance 2' do
    lng_lat1 = [one, one]
    lng_lat2 = [two, two]

    actual = @subject.call(lng_lat1, lng_lat2)

    expected = '1.414213562373095048801688724'.to_d
    expect(actual).to eq(expected)
  end

  private

  def zero
    @zero ||= '0'.to_d
  end

  def one
    @one ||= '1'.to_d
  end

  def two
    @two ||= '2'.to_d
  end
end
