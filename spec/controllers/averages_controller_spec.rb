require 'rails_helper'

describe Api::AveragesController do
  it '#index adds defaults to missing params and returns result from AverageInfo#as_json' do
    q = {
      north: '1.5',
      south: '2.5',
      west: '3.5',
      east: '4.5',
      grid_size_x: '5',
      grid_size_y: '6'
    }
    expected = {
      north: 1.5,
      south: 2.5,
      west: 3.5,
      east: 4.5,
      grid_size_x: 5,
      grid_size_y: 6,
      time_from: Time.new(2_010).to_i,
      time_to: Time.new(2_100).end_of_year.to_i,
      session_ids: []
    }
    result = [{}, {}]
    info = double
    expect(AverageInfo).to receive(:new).with(expected).and_return(info)
    expect(info).to receive(:as_json).and_return(result)

    get :index, params: { q: q }, format: :json

    expect(response.body).to eq(result.to_json)
  end
end
