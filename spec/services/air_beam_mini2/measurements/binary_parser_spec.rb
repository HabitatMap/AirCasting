require 'rails_helper'

RSpec.describe AirBeamMini2::Measurements::BinaryParser do
  subject(:parser) { described_class.new }

  def build_binary(measurements)
    count = measurements.size
    header = ['ABBA', count].pack('a4v')
    body = measurements.map { |m| [m[:epoch], m[:measurement_type_id], m[:value]].pack('VCe') }.join
    payload = header + body
    checksum = payload.bytes.inject(0, :^)
    payload + [checksum].pack('C')
  end

  describe '#call' do
    context 'with a valid single-measurement payload' do
      let(:epoch) { 1_711_619_400 }
      let(:binary) { build_binary([{ epoch: epoch, measurement_type_id: 2, value: 25.5 }]) }

      it 'returns an array with one measurement' do
        result = parser.call(binary)
        expect(result.size).to eq(1)
        expect(result.first[:epoch]).to eq(epoch)
        expect(result.first[:measurement_type_id]).to eq(2)
        expect(result.first[:value]).to be_within(0.01).of(25.5)
      end
    end

    context 'with multiple measurements' do
      let(:binary) do
        build_binary([
          { epoch: 1_711_619_400, measurement_type_id: 1, value: 10.0 },
          { epoch: 1_711_619_460, measurement_type_id: 2, value: 20.0 },
        ])
      end

      it 'parses all measurements in order' do
        result = parser.call(binary)
        expect(result.size).to eq(2)
        expect(result.map { |m| m[:measurement_type_id] }).to eq([1, 2])
      end
    end

    context 'with invalid magic bytes' do
      let(:binary) do
        bad = build_binary([{ epoch: 1_711_619_400, measurement_type_id: 2, value: 1.0 }])
        'XXXX' + bad[4..]
      end

      it 'raises ParseError' do
        expect { parser.call(binary) }.to raise_error(described_class::ParseError, /magic/)
      end
    end

    context 'with corrupted checksum' do
      let(:binary) do
        good = build_binary([{ epoch: 1_711_619_400, measurement_type_id: 2, value: 1.0 }])
        good[0..-2] + [(good.bytes.last ^ 0xFF)].pack('C')
      end

      it 'raises ParseError' do
        expect { parser.call(binary) }.to raise_error(described_class::ParseError, /checksum/)
      end
    end

    context 'with payload too short' do
      it 'raises ParseError' do
        expect { parser.call('AB') }.to raise_error(described_class::ParseError, /too short/)
      end
    end

    context 'with zero count' do
      let(:binary) do
        payload = ['ABBA', 0].pack('a4v')
        checksum = payload.bytes.inject(0, :^)
        payload + [checksum].pack('C')
      end

      it 'raises ParseError' do
        expect { parser.call(binary) }.to raise_error(described_class::ParseError, /zero/)
      end
    end
  end
end
