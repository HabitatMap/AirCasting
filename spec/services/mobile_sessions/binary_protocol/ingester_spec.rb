require 'rails_helper'

RSpec.describe MobileSessions::BinaryProtocol::Ingester do
  subject(:ingester) { described_class.new }

  let(:user) { create(:user) }
  let(:session) do
    create(:mobile_session, user: user, time_zone: 'America/New_York',
                            start_time_local: Time.utc(2026, 8, 14, 12, 0, 0),
                            end_time_local: Time.utc(2026, 8, 14, 12, 0, 0))
  end
  let!(:stream) do
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2)
  end

  let(:epoch) { Time.utc(2026, 8, 14, 10, 0, 0).to_i }

  def frame(epoch:, type_id:, value:, lat:, lng:)
    [epoch, type_id, value, lat, lng].pack('NCgGG')
  end

  def payload(frames)
    header = ["\xAB\xBA", frames.size].pack('a2n')
    body = header + frames.join
    body + [body.bytes.inject(0, :^)].pack('C')
  end

  it 'returns Success and imports measurements with per-point location' do
    binary = payload([frame(epoch: epoch, type_id: 2, value: 12.5, lat: 40.7128, lng: -74.006)])

    expect { ingester.call(session: session, binary: binary) }
      .to change(Measurement, :count).by(1)

    m = stream.reload.measurements.last
    expect(m.value).to be_within(0.001).of(12.5)
    expect(m.latitude).to be_within(1e-6).of(40.7128)
    expect(m.longitude).to be_within(1e-6).of(-74.006)
    expect(m.location).to be_present
  end

  it 'bumps the stream measurements_count and refreshes aggregates' do
    binary = payload([
      frame(epoch: epoch, type_id: 2, value: 10.0, lat: 40.0, lng: -74.0),
      frame(epoch: epoch + 5, type_id: 2, value: 20.0, lat: 41.0, lng: -75.0),
    ])
    ingester.call(session: session, binary: binary)

    stream.reload
    expect(stream.measurements_count).to eq(2)
    expect(stream.average_value).to be_within(0.001).of(15.0)
    expect(stream.min_latitude).to be_within(1e-6).of(40.0)
    expect(stream.max_latitude).to be_within(1e-6).of(41.0)
    expect(stream.start_latitude).to be_within(1e-6).of(40.0)
  end

  it 'updates the session end and pulls start earlier from measurement bounds' do
    binary = payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 40.0, lng: -74.0)])
    ingester.call(session: session, binary: binary)

    session.reload
    # epoch 10:00 UTC = 06:00 America/New_York, stored local-as-utc
    expect(session.start_time_local).to eq(Time.utc(2026, 8, 14, 6, 0, 0))
    expect(session.end_time_local).to eq(Time.utc(2026, 8, 14, 6, 0, 0))
  end

  it 'silently skips frames for an unknown sensor_type_id' do
    binary = payload([frame(epoch: epoch, type_id: 99, value: 1.0, lat: 40.0, lng: -74.0)])
    expect { ingester.call(session: session, binary: binary) }.not_to change(Measurement, :count)
    expect(ingester.call(session: session, binary: binary)).to be_success
  end

  it 'returns Failure with the parser error_code on a corrupt payload' do
    result = ingester.call(session: session, binary: 'not binary')
    expect(result).to be_failure
    expect(result.errors[:error_code]).to be_present
  end
end
