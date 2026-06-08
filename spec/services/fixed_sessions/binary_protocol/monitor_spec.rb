require 'rails_helper'

RSpec.describe FixedSessions::BinaryProtocol::Monitor do
  subject(:monitor) { described_class.new }

  let(:session) { instance_double(FixedSession, uuid: 'test-uuid-123', time_zone: 'UTC') }
  let(:scope) { instance_double(Sentry::Scope, set_tags: nil, set_context: nil, set_fingerprint: nil) }

  before do
    allow(Sentry).to receive(:with_scope).and_yield(scope)
    allow(Sentry).to receive(:capture_message)
  end

  describe '#report_parse_error' do
    it 'sends error-level event with error code in event name' do
      monitor.report_parse_error(
        error_code: 'invalid_checksum',
        message: 'XOR checksum does not match payload',
        session: session,
        binary_size: 42,
        measurement_count: 5,
      )

      expect(scope).to have_received(:set_tags).with(hash_including(
        source: 'binary_protocol',
        error_code: 'invalid_checksum',
        measurement_count: 5,
      ))
      expect(scope).to have_received(:set_context).with('binary_protocol', hash_including(
        session_uuid: 'test-uuid-123',
        binary_size: 42,
        measurement_count: 5,
      ))
      expect(Sentry).to have_received(:capture_message).with('binary_protocol.parse_error.invalid_checksum', level: 'error')
    end
  end

  describe '#report_unknown_sensor_type' do
    it 'sends warning-level event with sensor type details' do
      monitor.report_unknown_sensor_type(
        session: session,
        sensor_type_id: 99,
        known_sensor_type_ids: [1, 2, 3],
      )

      expect(scope).to have_received(:set_tags).with(hash_including(
        source: 'binary_protocol',
        sensor_type_id: 99,
      ))
      expect(scope).to have_received(:set_context).with('binary_protocol', hash_including(
        sensor_type_id: 99,
        known_sensor_type_ids: [1, 2, 3],
      ))
      expect(Sentry).to have_received(:capture_message).with('binary_protocol.unknown_sensor_type', level: 'warning')
    end
  end

  describe '#report_session_not_found' do
    it 'sends warning-level event with session UUID and auth method' do
      monitor.report_session_not_found(session_uuid: 'missing-uuid', auth_method: 'bearer')

      expect(scope).to have_received(:set_tags).with(hash_including(
        source: 'binary_protocol',
        auth_method: 'bearer',
      ))
      expect(scope).to have_received(:set_context).with('binary_protocol', { session_uuid: 'missing-uuid' })
      expect(Sentry).to have_received(:capture_message).with('binary_protocol.session_not_found', level: 'warning')
    end
  end

  describe '#report_auth_failure' do
    it 'sends warning-level event' do
      monitor.report_auth_failure(session_uuid: 'some-uuid')

      expect(scope).to have_received(:set_tags).with(hash_including(source: 'binary_protocol'))
      expect(Sentry).to have_received(:capture_message).with('binary_protocol.auth_failure', level: 'warning')
    end
  end

  describe '#report_transaction_error' do
    it 'sends error-level event with error message' do
      monitor.report_transaction_error(session: session, message: 'Validation failed')

      expect(scope).to have_received(:set_context).with('binary_protocol', hash_including(
        message: 'Validation failed',
      ))
      expect(Sentry).to have_received(:capture_message).with('binary_protocol.transaction_error', level: 'error')
    end
  end

  describe 'fingerprinting' do
    it 'sets fingerprint with event name and error code' do
      monitor.report_parse_error(
        error_code: 'payload_too_short',
        message: 'payload too short',
        session: session,
        binary_size: 3,
        measurement_count: nil,
      )

      expect(scope).to have_received(:set_fingerprint).with(['binary_protocol.parse_error.payload_too_short', 'payload_too_short'])
    end

    it 'omits nil error_code from fingerprint' do
      monitor.report_auth_failure(session_uuid: 'some-uuid')

      expect(scope).to have_received(:set_fingerprint).with(['binary_protocol.auth_failure', 'unauthorized'])
    end
  end
end
