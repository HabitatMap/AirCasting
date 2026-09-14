require 'rails_helper'

RSpec.describe MobileSessions::BinaryProtocol::Ingester do
  subject(:ingester) { described_class.new(monitor: monitor) }

  let(:monitor) do
    instance_double(
      ::BinaryProtocol::Monitor,
      report_parse_error: nil,
      report_unknown_sensor_type: nil,
      report_import_failure: nil,
      report_transaction_error: nil,
    )
  end

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

  it 'is idempotent on resend — no duplicate rows, no counter inflation' do
    binary = payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 40.0, lng: -74.0)])
    ingester.call(session: session, binary: binary)

    expect { ingester.call(session: session, binary: binary) }.not_to change(Measurement, :count)
    expect(stream.reload.measurements_count).to eq(1)
  end

  it 'sets session bounds from earliest/latest across resends (backfill does not regress end)' do
    later = payload([frame(epoch: epoch + 3600, type_id: 2, value: 1.0, lat: 40.0, lng: -74.0)])
    earlier = payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 41.0, lng: -75.0)])

    ingester.call(session: session, binary: later)
    ingester.call(session: session, binary: earlier) # older batch arrives after

    session.reload
    expect(session.start_time_local).to eq(Time.utc(2026, 8, 14, 6, 0, 0))  # epoch 10:00 UTC = 06:00 NY
    expect(session.end_time_local).to eq(Time.utc(2026, 8, 14, 7, 0, 0))    # +1h, not pulled back
  end

  it 'rejects the whole upload when a sensor_type_id has no stream on this session' do
    binary = payload([frame(epoch: epoch, type_id: 99, value: 1.0, lat: 40.0, lng: -74.0)])

    result = nil
    expect { result = ingester.call(session: session, binary: binary) }
      .not_to change(Measurement, :count)
    expect(result).to be_failure
    expect(result.errors[:error_code]).to eq(MobileSessions::ErrorCodes::UNSUPPORTED_SENSOR_TYPE)
    expect(result.errors[:message]).to include('99')
  end

  it 'stores nothing at all when only some of the frames name an unknown sensor' do
    binary = payload([
      frame(epoch: epoch, type_id: 2, value: 1.0, lat: 40.0, lng: -74.0),
      frame(epoch: epoch + 1, type_id: 99, value: 2.0, lat: 40.0, lng: -74.0),
    ])

    expect { ingester.call(session: session, binary: binary) }.not_to change(Measurement, :count)
    expect(stream.reload.measurements_count).to eq(0)
  end

  it 'names every unknown sensor_type_id, not just the first' do
    binary = payload([
      frame(epoch: epoch, type_id: 98, value: 1.0, lat: 40.0, lng: -74.0),
      frame(epoch: epoch + 1, type_id: 99, value: 2.0, lat: 40.0, lng: -74.0),
    ])

    result = ingester.call(session: session, binary: binary)
    expect(result.errors[:message]).to include('98, 99')
  end

  it 'returns Failure with the parser error_code on a corrupt payload' do
    result = ingester.call(session: session, binary: 'not binary')
    expect(result).to be_failure
    expect(result.errors[:error_code]).to be_present
  end

  describe 'monitoring' do
    it 'reports the rejected sensor_type_id alongside what the session does have' do
      expect(monitor).to receive(:report_unknown_sensor_type).with(
        session: session,
        sensor_type_id: 99,
        known_sensor_type_ids: [2],
      )

      ingester.call(
        session: session,
        binary: payload([frame(epoch: epoch, type_id: 99, value: 1.0, lat: 40.0, lng: -74.0)]),
      )
    end

    it 'reports a parse error with the payload size and the frame count the header claimed' do
      expect(monitor).to receive(:report_parse_error).with(
        hash_including(
          error_code: MobileSessions::BinaryProtocol::Parser::ErrorCodes::INVALID_CHECKSUM,
          session: session,
          binary_size: 30,
          measurement_count: 1,
        ),
      )

      binary = payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 40.0, lng: -74.0)])
      ingester.call(session: session, binary: binary[0..-2] + [0xFF].pack('C'))
    end

    it 'reports rows the bulk import rejected, which the 200 response hides' do
      failed = double(errors: double(full_messages: ['Value is not a number']))
      allow(Measurement).to receive(:import).and_return(double(failed_instances: [failed]))

      expect(monitor).to receive(:report_import_failure).with(
        session: session,
        stream_id: stream.id,
        failed_count: 1,
        message: 'Value is not a number',
      )

      ingester.call(
        session: session,
        binary: payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 40.0, lng: -74.0)]),
      )
    end

    it 'stays quiet on a clean ingest' do
      expect(monitor).not_to receive(:report_parse_error)
      expect(monitor).not_to receive(:report_unknown_sensor_type)
      expect(monitor).not_to receive(:report_import_failure)
      expect(monitor).not_to receive(:report_transaction_error)

      ingester.call(
        session: session,
        binary: payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 40.0, lng: -74.0)]),
      )
    end

    it 'defaults to the mobile source so events never merge with the fixed ones' do
      expect(::BinaryProtocol::Monitor).to receive(:new)
        .with(source: ::BinaryProtocol::Monitor::MOBILE)
        .and_return(monitor)

      described_class.new
    end
  end
end
