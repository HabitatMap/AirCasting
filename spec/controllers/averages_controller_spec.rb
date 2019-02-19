require 'rails_helper'

describe Api::AveragesController do
  it "#index adds defaults to missing params and returns result from AverageInfo#as_json" do
    q = {
      north: "1.5",
      south: "2.5",
      west: "3.5",
      east: "4.5",
      grid_size_x: "5",
      grid_size_y: "6"
    }
    expected = {
      north: 1.5,
      south: 2.5,
      west: 3.5,
      east: 4.5,
      grid_size_x: 5,
      grid_size_y: 6,
      time_from: 0,
      time_to: 2359,
      day_from: 0,
      day_to: 365,
      year_from: 2010,
      year_to: 2050,
      session_ids: []
    }
    result = [{}, {}]
    info = double
    expect(AverageInfo).to receive(:new).with(expected).and_return(info)
    expect(info).to receive(:as_json).and_return(result)

    get :index, q: q, format: :json

    expect(response.body).to eq(result.to_json)
  end
end
