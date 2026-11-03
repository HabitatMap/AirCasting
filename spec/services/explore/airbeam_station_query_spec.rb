require 'rails_helper'

describe Explore::AirbeamStationQuery do
  let(:measured_at) { 1.hour.ago.change(usec: 0) }

  def session(**attributes)
    create(
      :fixed_session,
      title: 'Roof',
      latitude: 40.7,
      longitude: -74.0,
      time_zone: 'America/New_York',
      last_measurement_at: 5.minutes.ago,
      **attributes,
    )
  end

  def stream(session, sensor_name: 'AirBeamMini-PM2.5', measurement_type: 'Particulate Matter',
             unit_symbol: 'µg/m³', package_name: 'AirBeamMini:00189610719f')
    create(
      :stream,
      session: session,
      sensor_name: sensor_name,
      measurement_type: measurement_type,
      unit_symbol: unit_symbol,
      sensor_package_name: package_name,
    )
  end

  def measurement(stream, value:, at: measured_at)
    create(:fixed_measurement, stream: stream, value: value, time: at, time_with_time_zone: at)
  end

  it 'returns the session with its streams, device, share link and 24h range' do
    fixed = session
    pm = stream(fixed)
    measurement(pm, value: 12.4)
    measurement(pm, value: 3.2, at: measured_at - 2.hours)

    item = subject.call(uuid: fixed.uuid)

    expect(item).to have_attributes(
      source: 'airbeam',
      uuid: fixed.uuid,
      title: 'Roof',
      provider: fixed.user.username,
      latitude: 40.7,
      longitude: -74.0,
      time_zone: 'America/New_York',
      device_model: 'AirBeamMini',
      is_active: true,
      share_url: "http://#{A9n.host_}/s/#{fixed.url_token}",
    )
    expect(item.streams.map(&:to_h)).to eq(
      [
        {
          id: pm.id,
          sensor_name: 'AirBeamMini-PM2.5',
          parameter: 'Particulate Matter',
          unit_symbol: 'µg/m³',
          last_value: 12.4,
          last_measured_at: measured_at,
          update_frequency: '1 minute',
          min_24h: 3.2,
          max_24h: 12.4,
        },
      ],
    )
  end

  it 'returns a dormant session, and a finished one, with no 24h range' do
    dormant = session(last_measurement_at: 3.days.ago)
    measurement(stream(dormant), value: 9.0, at: 3.days.ago)
    finished = session(finished_at: 1.hour.ago)
    measurement(stream(finished), value: 9.0)

    expect(subject.call(uuid: dormant.uuid)).to have_attributes(is_active: false)
    expect(subject.call(uuid: dormant.uuid).streams.first)
      .to have_attributes(min_24h: nil, max_24h: nil, last_value: 9.0)
    expect(subject.call(uuid: finished.uuid)).to have_attributes(is_active: false)
  end

  it 'returns every stream, including those the map filter does not name' do
    fixed = session
    %w[AirBeamMini-PM10 AirBeamMini-PM1 AirBeamMini-PM2.5].each do |sensor_name|
      measurement(stream(fixed, sensor_name: sensor_name), value: 5.0)
    end
    measurement(stream(fixed, sensor_name: 'AirBeamMini-F', measurement_type: 'Temperature',
                       unit_symbol: 'F'), value: 60.0)

    streams = subject.call(uuid: fixed.uuid).streams

    expect(streams.map(&:sensor_name)).to eq(
      %w[AirBeamMini-PM1 AirBeamMini-PM10 AirBeamMini-PM2.5 AirBeamMini-F],
    )
  end

  it 'lists a stream that has never reported, with no reading and no range' do
    fixed = session
    silent = stream(fixed, sensor_name: 'AirBeamMini-RH', measurement_type: 'Humidity', unit_symbol: '%')

    expect(subject.call(uuid: fixed.uuid).streams.map(&:to_h)).to eq(
      [
        {
          id: silent.id,
          sensor_name: 'AirBeamMini-RH',
          parameter: 'Humidity',
          unit_symbol: '%',
          last_value: nil,
          last_measured_at: nil,
          update_frequency: '1 minute',
          min_24h: nil,
          max_24h: nil,
        },
      ],
    )
  end

  it 'prefers the last hourly average to the newest reading, as the map does' do
    fixed = session
    pm = stream(fixed)
    measurement(pm, value: 12.4)
    average =
      create(:stream_hourly_average, stream: pm, value: 7, date_time: measured_at)
    pm.update!(last_hourly_average_id: average.id)

    expect(subject.call(uuid: fixed.uuid).streams.first.last_value).to eq(7.0)
  end

  it 'matches a uuid stored in a different case' do
    fixed = session(uuid: 'AB12C-Mixed-Case')
    measurement(stream(fixed), value: 1.0)

    expect(subject.call(uuid: 'ab12c-mixed-case')).to be_present
  end

  it 'returns nothing for a session the map would not show either' do
    measurement(stream(session(contribute: false)), value: 1.0)
    measurement(stream(session(is_indoor: true)), value: 1.0)
    government = session(user: create(:user, username: 'US EPA AirNow'))
    measurement(stream(government), value: 1.0)

    expect(FixedSession.pluck(:uuid).map { |uuid| subject.call(uuid: uuid) }).to all(be_nil)
  end

  it 'returns nothing for an unknown uuid' do
    expect(subject.call(uuid: 'nobody')).to be_nil
  end

  describe 'device model' do
    it 'prefers the device row, and never its name or MAC address' do
      device = create(:device, model: 'AirBeam3', name: "Jane's rooftop beam")
      fixed = session(device: device, user: device.user)
      measurement(stream(fixed, package_name: 'AirBeamMini:00189610719f'), value: 1.0)

      expect(subject.call(uuid: fixed.uuid).device_model).to eq('AirBeam3')
    end

    it 'falls back to the sensor name when the package name is Builtin' do
      fixed = session
      measurement(stream(fixed, sensor_name: 'AirBeam3-PM2.5', package_name: 'Builtin'), value: 1.0)

      expect(subject.call(uuid: fixed.uuid).device_model).to eq('AirBeam3')
    end

    it 'is nil when nothing names a known model' do
      fixed = session
      measurement(stream(fixed, sensor_name: 'LHC', package_name: 'CERN'), value: 1.0)

      expect(subject.call(uuid: fixed.uuid).device_model).to be_nil
    end
  end
end
