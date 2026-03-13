# Shared contract for the stream-show JSON shape returned by both
# GET /api/v3/fixed_streams/:id  and  GET /api/v3/station_streams/:id
#
# Include this in a request spec context where a GET has already been
# performed (e.g. via a before block) so that `response` is populated.
RSpec.shared_examples 'stream show response' do
  let(:parsed_body) { JSON.parse(response.body, symbolize_names: true) }

  it 'returns HTTP 200' do
    expect(response.status).to eq(200)
  end

  it 'has exactly the required top-level keys' do
    expect(parsed_body.keys).to contain_exactly(:stream, :measurements, :stream_daily_averages)
  end

  it 'stream object has exactly the required keys' do
    expect(parsed_body[:stream].keys).to contain_exactly(
      :session_id,
      :active,
      :title,
      :latitude,
      :longitude,
      :profile,
      :sensor_name,
      :unit_symbol,
      :update_frequency,
      :last_update,
      :start_time,
      :end_time,
      :min,
      :low,
      :middle,
      :high,
      :max,
    )
  end

  it 'measurements is an array of time/value pairs with integer timestamps' do
    measurements = parsed_body[:measurements]
    expect(measurements).to be_an(Array)
    measurements.each do |m|
      expect(m.keys).to contain_exactly(:time, :value)
      expect(m[:time]).to be_a(Integer)
      expect(m[:value]).to be_a(Numeric)
    end
  end

  it 'stream_daily_averages is an array of date/value pairs with ISO date strings and integer values' do
    averages = parsed_body[:stream_daily_averages]
    expect(averages).to be_an(Array)
    averages.each do |a|
      expect(a.keys).to contain_exactly(:date, :value)
      expect(a[:date]).to match(/\A\d{4}-\d{2}-\d{2}\z/)
      expect(a[:value]).to be_a(Integer)
    end
  end
end
