require 'rails_helper'

describe Outliers::CalculateCentroid do
  before(:each) { @subject = Outliers::CalculateCentroid.new }

  it 'with one measurement it returns its coordinates' do
    m = Measurement.new(longitude: one, latitude: one)

    actual = @subject.call([m])

    expect(actual).to eq([one, one])
  end

  it 'with two measurements with the same coordinates it returns those coordinates' do
    m1 = Measurement.new(longitude: one, latitude: one)
    m2 = Measurement.new(longitude: one, latitude: one)

    actual = @subject.call([m1, m2])

    expect(actual).to eq([one, one])
  end

  it 'with two measurements with different coordinates it returns the midpoint' do
    m1 = Measurement.new(longitude: one, latitude: one)
    m2 = Measurement.new(longitude: three, latitude: three)

    actual = @subject.call([m1, m2])

    expect(actual).to eq([two, two])
  end

  it 'with three measurements with different coordinates it returns the centroid' do
    m1 = Measurement.new(longitude: one, latitude: one)
    m2 = Measurement.new(longitude: four, latitude: one)
    m3 = Measurement.new(longitude: four, latitude: four)

    actual = @subject.call([m1, m2, m3])

    expect(actual).to eq([three, two])
  end

  it 'with four measurements with different coordinates it returns the centroid' do
    m1 = Measurement.new(longitude: one, latitude: one)
    m2 = Measurement.new(longitude: two, latitude: one)
    m3 = Measurement.new(longitude: two, latitude: two)
    m4 = Measurement.new(longitude: one, latitude: two)

    actual = @subject.call([m1, m2, m3, m4])

    expect(actual).to eq([one_point_five, one_point_five])
  end

  private

  def one
    @one ||= '1'.to_d
  end

  def two
    @two ||= '2'.to_d
  end

  def three
    @three ||= '3'.to_d
  end

  def four
    @four ||= '4'.to_d
  end

  def one_point_five
    @one_point_five ||= '1.5'.to_d
  end
end
