require 'rails_helper'

describe StreamValuesWorker do
  it 'updates bounding_box with only valid measurements' do
    stream = FactoryBot.create(:stream)
    valid_data = FactoryBot
      .attributes_for(:measurement, latitude: random_big_decimal, longitude: random_big_decimal)
      .transform_keys(&:to_s)
    invalid_data = valid_data.yield_self do |params|
      required_fields = [:longitude, :latitude, :value].map(&:to_s)
      invalid_params = required_fields.map { |field| { field => nil } }
      params.merge(invalid_params.sample)
    end

    subject.perform(stream.id, [valid_data, invalid_data].shuffle)

    expect(stream.reload.min_latitude).to eq(valid_data['latitude'])
    expect(stream.reload.max_latitude).to eq(valid_data['latitude'])
    expect(stream.reload.min_longitude).to eq(valid_data['longitude'])
    expect(stream.reload.max_longitude).to eq(valid_data['longitude'])
  end

  it 'updates average_value with only valid measurements' do
    stream = FactoryBot.create(:stream)
    valid_data = FactoryBot
      .attributes_for(:measurement, value: random_int)
      .transform_keys(&:to_s)
    invalid_data = valid_data.yield_self do |params|
      required_fields = [:longitude, :latitude, :value].map(&:to_s)
      invalid_params = required_fields.map { |field| { field => nil } }
      params.merge(invalid_params.sample)
    end

    subject.perform(stream.id, [valid_data, invalid_data].shuffle)

    expect(stream.reload.average_value).to eq(valid_data['value'])
  end

  it 'updates start_longitude and start_latitude with only valid measurements' do
    stream = FactoryBot.create(:stream)
    valid_data = FactoryBot
      .attributes_for(:measurement, latitude: random_big_decimal, longitude: random_big_decimal)
      .transform_keys(&:to_s)
    invalid_data = valid_data.yield_self do |params|
      required_fields = [:longitude, :latitude, :value].map(&:to_s)
      invalid_params = required_fields.map { |field| { field => nil } }
      params.merge(invalid_params.sample)
    end

    subject.perform(stream.id, [valid_data, invalid_data].shuffle)

    expect(stream.reload.start_longitude).to eq(valid_data['longitude'])
    expect(stream.reload.start_latitude).to eq(valid_data['latitude'])
  end
end
