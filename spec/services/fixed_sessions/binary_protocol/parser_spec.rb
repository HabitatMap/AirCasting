require 'rails_helper'

RSpec.describe FixedSessions::BinaryProtocol::Parser do
  subject(:parser) { described_class.new }

  def build_binary(measurements, magic: "\xAB\xBA", count: measurements.size)
    header = [magic, count].pack('a2n')
    body = measurements.map { |m| [m[:epoch], m[:sensor_type_id], m[:value]].pack('NCg') }.join
    payload = header + body
    checksum = payload.bytes.inject(0, :^)
    payload + [checksum].pack('C')
  end

  def expect_parse_error(binary, error_code:, message:, measurement_count: :not_checked)
    expect { parser.call(binary) }.to raise_error(described_class::ParseError) do |e|
      expect(e.error_code).to eq(error_code)
      expect(e.message).to match(message)
      expect(e.measurement_count).to eq(measurement_count) unless measurement_count == :not_checked
    end
  end

  describe '#call' do
    context 'with a valid single-measurement payload' do
      let(:epoch) { 1_711_619_400 }
      let(:binary) { build_binary([{ epoch: epoch, sensor_type_id: 2, value: 25.5 }]) }

      it 'returns an array with one measurement' do
        result = parser.call(binary)
        expect(result.size).to eq(1)
        expect(result.first[:epoch]).to eq(epoch)
        expect(result.first[:sensor_type_id]).to eq(2)
        expect(result.first[:value]).to be_within(0.01).of(25.5)
      end
    end

    context 'with multiple measurements' do
      let(:binary) do
        build_binary([
          { epoch: 1_711_619_400, sensor_type_id: 1, value: 10.0 },
          { epoch: 1_711_619_460, sensor_type_id: 2, value: 20.0 },
        ])
      end

      it 'parses all measurements in order' do
        result = parser.call(binary)
        expect(result.size).to eq(2)
        expect(result.map { |m| m[:sensor_type_id] }).to eq([1, 2])
      end
    end

    context 'with invalid magic bytes' do
      let(:binary) { build_binary([{ epoch: 1_711_619_400, sensor_type_id: 2, value: 1.0 }], magic: "\xFF\xFF") }

      it 'raises ParseError with error_code invalid_magic_bytes and nil measurement_count' do
        expect_parse_error(binary, error_code: 'invalid_magic_bytes', message: /magic/, measurement_count: nil)
      end
    end

    context 'with corrupted checksum' do
      let(:binary) do
        good = build_binary([{ epoch: 1_711_619_400, sensor_type_id: 2, value: 1.0 }])
        good[0..-2] + [(good.bytes.last ^ 0xFF)].pack('C')
      end

      it 'raises ParseError with error_code invalid_checksum and measurement_count' do
        expect_parse_error(binary, error_code: 'invalid_checksum', message: /checksum/, measurement_count: 1)
      end
    end

    context 'with payload too short' do
      it 'raises ParseError with error_code payload_too_short and nil measurement_count' do
        expect_parse_error('AB', error_code: 'payload_too_short', message: /too short/, measurement_count: nil)
      end
    end

    context 'with zero count' do
      let(:binary) { build_binary([], count: 0) }

      it 'raises ParseError with error_code empty_measurement_count' do
        expect_parse_error(binary, error_code: 'empty_measurement_count', message: /zero/)
      end
    end

    context 'with epoch zero in a frame' do
      let(:binary) { build_binary([{ epoch: 0, sensor_type_id: 2, value: 1.0 }]) }

      it 'raises ParseError with error_code invalid_epoch and measurement_count' do
        expect_parse_error(binary, error_code: 'invalid_epoch', message: /greater than zero/, measurement_count: 1)
      end
    end

    context 'with epoch more than 24 hours in the future' do
      let(:binary) { build_binary([{ epoch: Time.current.to_i + 90_000, sensor_type_id: 2, value: 1.0 }]) }

      it 'raises ParseError with error_code invalid_epoch and measurement_count' do
        expect_parse_error(binary, error_code: 'invalid_epoch', message: /future/, measurement_count: 1)
      end
    end

    context 'with a non-finite value (Infinity)' do
      let(:binary) { build_binary([{ epoch: 1_711_619_400, sensor_type_id: 2, value: Float::INFINITY }]) }

      it 'raises ParseError with error_code invalid_value and measurement_count' do
        expect_parse_error(binary, error_code: 'invalid_value', message: /not a finite number/, measurement_count: 1)
      end
    end

    context 'with payload size mismatch (count says 2, only 1 frame present)' do
      let(:binary) { build_binary([{ epoch: 1_711_619_400, sensor_type_id: 2, value: 10.0 }], count: 2) }

      it 'raises ParseError with error_code payload_size_mismatch and measurement_count' do
        expect_parse_error(binary, error_code: 'payload_size_mismatch', message: "mismatch", measurement_count: 2)
      end
    end
  end
end
