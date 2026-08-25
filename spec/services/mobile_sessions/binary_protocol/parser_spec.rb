require 'rails_helper'

RSpec.describe MobileSessions::BinaryProtocol::Parser do
  subject(:parser) { described_class.new }

  EC = MobileSessions::BinaryProtocol::Parser::ErrorCodes

  def frame(epoch:, type_id:, value:, lat:, lng:)
    [epoch, type_id, value, lat, lng].pack('NCgGG')
  end

  def payload(frames, count: frames.size, magic: "\xAB\xBA")
    header = [magic, count].pack('a2n')
    body = header + frames.join
    body + [body.bytes.inject(0, :^)].pack('C')
  end

  let(:epoch) { Time.current.to_i }

  it 'parses one frame with per-point location and no milliseconds' do
    binary = payload([frame(epoch: epoch, type_id: 2, value: 12.5, lat: 40.7128, lng: -74.006)])
    result = parser.call(binary)

    expect(result.size).to eq(1)
    m = result.first
    expect(m[:epoch]).to eq(epoch)
    expect(m[:sensor_type_id]).to eq(2)
    expect(m[:value]).to be_within(0.001).of(12.5)
    expect(m[:latitude]).to be_within(1e-9).of(40.7128)
    expect(m[:longitude]).to be_within(1e-9).of(-74.006)
    expect(m).not_to have_key(:milliseconds)
  end

  it 'parses multiple frames' do
    binary = payload([
      frame(epoch: epoch, type_id: 1, value: 1.0, lat: 10.0, lng: 20.0),
      frame(epoch: epoch + 5, type_id: 2, value: 2.0, lat: 10.1, lng: 20.1),
    ])
    expect(parser.call(binary).size).to eq(2)
  end

  it 'preserves float64 coordinate precision (below the ~1m float32 error)' do
    lat = 40.712812345
    binary = payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: lat, lng: -74.0)])
    expect(parser.call(binary).first[:latitude]).to be_within(1e-9).of(lat)
  end

  it 'raises payload_too_short for a truncated header' do
    expect { parser.call("\xAB") }
      .to raise_error(described_class::ParseError) { |e| expect(e.error_code).to eq(EC::PAYLOAD_TOO_SHORT) }
  end

  it 'raises invalid_magic_bytes for a wrong magic' do
    binary = payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 1.0, lng: 1.0)], magic: "\xFF\xFF")
    expect { parser.call(binary) }
      .to raise_error(described_class::ParseError) { |e| expect(e.error_code).to eq(EC::INVALID_MAGIC_BYTES) }
  end

  it 'raises empty_measurement_count for zero count' do
    binary = payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 1.0, lng: 1.0)], count: 0)
    expect { parser.call(binary) }
      .to raise_error(described_class::ParseError) { |e| expect(e.error_code).to eq(EC::EMPTY_MEASUREMENT_COUNT) }
  end

  it 'raises payload_size_mismatch when count does not match bytes' do
    binary = payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 1.0, lng: 1.0)], count: 2)
    expect { parser.call(binary) }
      .to raise_error(described_class::ParseError) { |e| expect(e.error_code).to eq(EC::PAYLOAD_SIZE_MISMATCH) }
  end

  it 'raises invalid_epoch for a zero timestamp' do
    binary = payload([frame(epoch: 0, type_id: 2, value: 1.0, lat: 1.0, lng: 1.0)])
    expect { parser.call(binary) }
      .to raise_error(described_class::ParseError) { |e| expect(e.error_code).to eq(EC::INVALID_EPOCH) }
  end

  it 'raises invalid_value for a NaN value' do
    binary = payload([frame(epoch: epoch, type_id: 2, value: Float::NAN, lat: 1.0, lng: 1.0)])
    expect { parser.call(binary) }
      .to raise_error(described_class::ParseError) { |e| expect(e.error_code).to eq(EC::INVALID_VALUE) }
  end

  it 'raises invalid_location for out-of-range coordinates' do
    binary = payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 200.0, lng: 20.0)])
    expect { parser.call(binary) }
      .to raise_error(described_class::ParseError) { |e| expect(e.error_code).to eq(EC::INVALID_LOCATION) }
  end

  it 'raises invalid_checksum when the trailing byte is wrong' do
    binary = payload([frame(epoch: epoch, type_id: 2, value: 1.0, lat: 1.0, lng: 1.0)])
    corrupted = binary[0..-2] + [(binary.bytes.last ^ 0xFF)].pack('C')
    expect { parser.call(corrupted) }
      .to raise_error(described_class::ParseError) { |e| expect(e.error_code).to eq(EC::INVALID_CHECKSUM) }
  end
end
