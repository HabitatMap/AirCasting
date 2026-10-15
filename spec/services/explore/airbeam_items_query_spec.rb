require 'rails_helper'

describe Explore::AirbeamItemsQuery do
  let(:new_york) { Explore::Bounds.new(west: -75, east: -73, south: 40, north: 41) }

  def call(parameters: [], bounds: new_york, title: nil)
    subject.call(
      bounds: bounds,
      parameters: Explore::Parameters.select(parameters),
      title: title,
    )
  end

  def airbeam(sensor_names: %w[AirBeam3-PM2.5], **attributes)
    session =
      create(
        :fixed_session,
        latitude: 40.7,
        longitude: -74.0,
        last_measurement_at: 5.minutes.ago,
        **attributes,
      )
    sensor_names.each { |name| create(:stream, session: session, sensor_name: name) }
    session
  end

  def reading(session, sensor_name, value:, at:)
    create(
      :fixed_measurement,
      stream: session.streams.find_by!(sensor_name: sensor_name),
      value: value,
      time: at,
      time_with_time_zone: at,
    )
  end

  it 'returns an active session; a stream with no hourly average yet shows its newest reading' do
    newest = 2.minutes.ago.change(usec: 0)
    session =
      airbeam(
        sensor_names: %w[AirBeam3-RH AirBeam3-PM2.5],
        title: 'Roof',
        latitude: 40.75,
        longitude: -73.9,
      )
    reading(session, 'AirBeam3-PM2.5', value: 30.0, at: newest - 1.minute)
    reading(session, 'AirBeam3-PM2.5', value: 12.0, at: newest)
    reading(session, 'AirBeam3-RH', value: 55.0, at: newest - 1.minute)

    items = call

    expect(items.size).to eq(1)
    expect(items.first).to have_attributes(
      source: 'airbeam',
      uuid: session.uuid,
      title: 'Roof',
      provider: session.user.username,
      latitude: 40.75,
      longitude: -73.9,
      last_measured_at: newest,
    )
    expect(items.first.streams.map { |s| [s.sensor_name, s.parameter, s.last_value] }).to eq(
      [['AirBeam3-PM2.5', 'pm', 12.0], ['AirBeam3-RH', 'humidity', 55.0]],
    )
  end

  it 'shows the last hourly average, as the web map does, over the newest reading' do
    hour_end = Time.current.beginning_of_hour
    session = airbeam
    stream = session.streams.first
    reading(session, 'AirBeam3-PM2.5', value: 40.0, at: 1.minute.ago)
    stream.update!(
      last_hourly_average:
        create(:stream_hourly_average, stream: stream, value: 12, date_time: hour_end),
    )

    item = call.first

    expect(item.streams.map { |s| [s.last_value, s.last_measured_at] }).to eq(
      [[12.0, hour_end]],
    )
    expect(item.last_measured_at).to eq(hour_end)
  end

  it 'matches a stream stored under the canonical sensor name' do
    session = airbeam(sensor_names: %w[AirBeam-PM2.5])
    reading(session, 'AirBeam-PM2.5', value: 9.0, at: 1.minute.ago)

    expect(call(parameters: %w[pm]).map(&:uuid)).to eq([session.uuid])
  end

  it 'returns only the selected parameters, and no session without one' do
    both = airbeam(sensor_names: %w[AirBeam3-PM2.5 AirBeam3-F])
    reading(both, 'AirBeam3-PM2.5', value: 9.0, at: 1.minute.ago)
    reading(both, 'AirBeam3-F', value: 70.0, at: 1.minute.ago)
    temperature_only = airbeam(sensor_names: %w[AirBeam3-F])
    reading(temperature_only, 'AirBeam3-F', value: 70.0, at: 1.minute.ago)

    items = call(parameters: %w[pm])

    expect(items.map(&:uuid)).to eq([both.uuid])
    expect(items.first.streams.map(&:parameter)).to eq(%w[pm])
  end

  it 'leaves out PM1, PM10 and sensors outside the catalogue' do
    session = airbeam(sensor_names: %w[AirBeam3-PM1 AirBeam3-PM10 Phone\ Microphone])
    session.streams.each { |s| create(:fixed_measurement, stream: s) }

    expect(call).to be_empty
  end

  it 'leaves out a stream that never reported' do
    airbeam

    expect(call).to be_empty
  end

  {
    'indoor' => { is_indoor: true },
    'private' => { contribute: false },
    'finished' => { finished_at: 1.hour.ago },
    'silent for over 24 hours' => { last_measurement_at: 25.hours.ago },
    'outside the bounds' => { latitude: 52.2, longitude: 21.0 },
  }.each do |description, attributes|
    it "leaves out a session that is #{description}" do
      session = airbeam(**attributes)
      reading(session, 'AirBeam3-PM2.5', value: 9.0, at: 1.minute.ago)

      expect(call).to be_empty
    end
  end

  it 'leaves out the legacy government sessions' do
    %w[EEA US\ EPA\ AirNow].each do |username|
      session = airbeam(user: create(:user, username: username))
      reading(session, 'AirBeam3-PM2.5', value: 9.0, at: 1.minute.ago)
    end

    expect(call).to be_empty
  end

  it 'finds sessions on both sides of the antimeridian' do
    east = airbeam(latitude: -17.0, longitude: 179.5)
    west = airbeam(latitude: -17.0, longitude: -179.5)
    far = airbeam(latitude: -17.0, longitude: 0.0)
    [east, west, far].each do |session|
      reading(session, 'AirBeam3-PM2.5', value: 9.0, at: 1.minute.ago)
    end

    bounds = Explore::Bounds.new(west: 179, east: -179, south: -18, north: -16)

    expect(call(bounds: bounds).map(&:uuid)).to contain_exactly(east.uuid, west.uuid)
  end

  it 'filters by title' do
    session = airbeam(title: 'Backyard')
    reading(session, 'AirBeam3-PM2.5', value: 9.0, at: 1.minute.ago)
    other = airbeam(title: 'Roof')
    reading(other, 'AirBeam3-PM2.5', value: 9.0, at: 1.minute.ago)

    expect(call(title: 'yard').map(&:uuid)).to eq([session.uuid])
  end

  it 'does not query when no selected parameter is measured by AirBeams' do
    expect(FixedSession).not_to receive(:active)

    expect(call(parameters: %w[no2 ozone])).to eq([])
  end
end
