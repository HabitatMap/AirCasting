require 'rails_helper'

RSpec.describe MobileSessions::MeasurementsQuery do
  let(:user) { create(:user) }
  let(:session) do
    create(:mobile_session, user: user, time_zone: 'UTC',
                            end_time_local: Time.utc(2026, 8, 14, 12, 0, 0))
  end
  let!(:stream) { create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5') }

  let(:recent_time) { Time.utc(2026, 8, 14, 11, 30, 0) }
  let(:old_time) { Time.utc(2026, 8, 12, 10, 0, 0) }

  before do
    stream.build_measurements!([
      { time: recent_time, value: 12.5, latitude: 40.0, longitude: -74.0 },
      { time: old_time, value: 9.0, latitude: 41.0, longitude: -75.0 },
    ])
  end

  it 'defaults to the latest 24h (anchored on the session end)' do
    result = described_class.new(session: session).call

    points = result['AirBeamMini-PM2.5']
    expect(points.size).to eq(1)
    expect(points.first).to include(value: 12.5, latitude: 40.0, longitude: -74.0)
    expect(points.first[:time]).to eq(recent_time)
  end

  it 'returns older data when an explicit start_time/end_time window is given' do
    result = described_class.new(
      session: session,
      start_time: (old_time.to_i * 1000).to_s,
      end_time: (Time.utc(2026, 8, 14, 23, 0, 0).to_i * 1000).to_s,
    ).call

    expect(result['AirBeamMini-PM2.5'].size).to eq(2)
  end

  it 'filters to a single stream by sensor_name' do
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM1')

    result = described_class.new(session: session, sensor_name: 'AirBeamMini-PM2.5').call

    expect(result.keys).to eq(['AirBeamMini-PM2.5'])
  end

  it 'orders points by time ascending' do
    result = described_class.new(
      session: session,
      start_time: (old_time.to_i * 1000).to_s,
      end_time: (Time.utc(2026, 8, 14, 23, 0, 0).to_i * 1000).to_s,
    ).call

    times = result['AirBeamMini-PM2.5'].map { |p| p[:time] }
    expect(times).to eq(times.sort)
  end
end
