require 'rails_helper'

RSpec.describe MobileSessions::MeasurementsQuery do
  let(:user) { create(:user) }
  let(:session) do
    create(:mobile_session, user: user, time_zone: 'UTC',
                            end_time_local: Time.utc(2026, 8, 14, 12, 0, 0))
  end
  let!(:stream) { create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5') }

  let(:recent_time) { Time.utc(2026, 8, 14, 11, 30, 0) }
  let(:old_time) { Time.utc(2026, 8, 14, 2, 0, 0) }

  def epoch_ms(time) = time.to_i * 1_000

  def query(session: self.session, sensor_name: 'AirBeamMini-PM2.5', **rest)
    described_class.new(session: session, sensor_name: sensor_name, **rest).call
  end

  before do
    stream.build_measurements!([
      { time: recent_time, value: 12.5, latitude: 40.0, longitude: -74.0 },
      { time: old_time, value: 9.0, latitude: 41.0, longitude: -75.0 },
    ])
  end

  it 'defaults to the latest 6h (anchored on the session end)' do
    points = query

    expect(points.size).to eq(1)
    expect(points.first).to eq(
      time: epoch_ms(recent_time), value: 12.5, latitude: 40.0, longitude: -74.0,
    )
  end

  it 'returns older data when an explicit window is given' do
    points = query(
      start_time: epoch_ms(old_time),
      end_time: epoch_ms(Time.utc(2026, 8, 14, 12, 0, 0)),
    )

    expect(points.size).to eq(2)
  end

  it 'reads only the named stream' do
    other = create(:stream, session: session, sensor_name: 'AirBeamMini-PM1')
    other.build_measurements!(
      [{ time: recent_time, value: 1.0, latitude: 40.0, longitude: -74.0 }],
    )

    expect(query(sensor_name: 'AirBeamMini-PM1').map { |p| p[:value] }).to eq([1.0])
  end

  it 'is nil when the session has no such stream, so the caller can answer 404' do
    expect(query(sensor_name: 'AirBeam3-RH')).to be_nil
  end

  it 'orders points by time ascending' do
    times = query(
      start_time: epoch_ms(old_time),
      end_time: epoch_ms(Time.utc(2026, 8, 14, 12, 0, 0)),
    ).map { |p| p[:time] }

    expect(times).to eq(times.sort)
  end

  it 'returns every point in the window — no silent cap' do
    stream.build_measurements!(
      (1..50).map { |i| { time: Time.utc(2026, 8, 14, 10, 0, i), value: 1.0, latitude: 40.0, longitude: -74.0 } },
    )

    points = query(
      start_time: epoch_ms(Time.utc(2026, 8, 14, 10, 0, 0)),
      end_time: epoch_ms(Time.utc(2026, 8, 14, 10, 1, 0)),
    )

    expect(points.size).to eq(50)
  end

  context 'a session with no measurements yet (no end_time_local to anchor on)' do
    let(:empty_session) { create(:mobile_session, user: user, time_zone: 'UTC', end_time_local: nil) }
    let!(:empty_stream) { create(:stream, session: empty_session, sensor_name: 'AirBeamMini-PM1') }

    it 'is empty rather than nil — the stream exists, the data does not' do
      expect(query(session: empty_session, sensor_name: 'AirBeamMini-PM1')).to eq([])
    end

    it 'still answers an explicit window' do
      expect(
        query(
          session: empty_session,
          sensor_name: 'AirBeamMini-PM1',
          start_time: epoch_ms(Time.utc(2026, 8, 14, 0, 0, 0)),
          end_time: epoch_ms(Time.utc(2026, 8, 14, 6, 0, 0)),
        ),
      ).to eq([])
    end
  end

  context 'with a non-UTC session time zone (local-as-utc round trip via the ingester)' do
    let(:ny_session) do
      create(:mobile_session, user: user, time_zone: 'America/New_York',
                              end_time_local: Time.utc(2026, 8, 14, 8, 0, 0))
    end
    let!(:ny_stream) do
      create(:stream, session: ny_session, sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2)
    end
    let(:uploaded_epoch) { Time.utc(2026, 8, 14, 10, 0, 0) }

    before do
      # epoch 10:00 UTC = 06:00 America/New_York; the ingester stores it local-as-utc (06:00Z)
      frame = [uploaded_epoch.to_i, 2, 12.5, 40.0, -74.0].pack('NCgGG')
      body = ["\xAB\xBA", 1].pack('a2n') + frame
      binary = body + [body.bytes.inject(0, :^)].pack('C')
      MobileSessions::BinaryProtocol::Ingester.new.call(session: ny_session, binary: binary)
    end

    it 'returns the epoch the client uploaded, not the local-as-utc column value' do
      points = query(session: ny_session)

      expect(points.size).to eq(1)
      expect(points.first[:time]).to eq(epoch_ms(uploaded_epoch))
    end

    # The client sends the same epochs it uploaded, so the window has to be read in
    # the same domain the frames were: real UTC in, local-as-utc against the column.
    it 'reads an explicit window as epochs, not as local time' do
      points = query(
        session: ny_session,
        start_time: epoch_ms(Time.utc(2026, 8, 14, 9, 0, 0)),
        end_time: epoch_ms(Time.utc(2026, 8, 14, 11, 0, 0)),
      )

      expect(points.size).to eq(1)
      expect(points.first[:time]).to eq(epoch_ms(uploaded_epoch))
    end
  end
end
