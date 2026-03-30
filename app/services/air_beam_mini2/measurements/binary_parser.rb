module AirBeamMini2
  module Measurements
    class BinaryParser
      MAGIC = 'ABBA'
      HEADER_SIZE = 6  # 4 bytes magic + 2 bytes uint16 count
      MEASUREMENT_SIZE = 9  # 4 bytes uint32 epoch + 1 byte uint8 type_id + 4 bytes float32 value

      ParseError = Class.new(StandardError)

      def call(binary)
        raise ParseError, 'payload too short' if binary.bytesize < HEADER_SIZE + 1

        magic, count = binary.unpack('a4v')
        raise ParseError, 'invalid magic bytes' unless magic == MAGIC
        raise ParseError, 'empty payload: count is zero' if count.zero?

        raise ParseError, 'payload too short' if binary.bytesize < HEADER_SIZE + MEASUREMENT_SIZE + 1

        expected_size = HEADER_SIZE + (count * MEASUREMENT_SIZE) + 1
        raise ParseError, "payload size mismatch: expected #{expected_size}, got #{binary.bytesize}" unless binary.bytesize == expected_size

        measurements = parse_measurements(binary, count)
        validate_checksum!(binary)

        measurements
      end

      private

      def parse_measurements(binary, count)
        measurements = []
        offset = HEADER_SIZE
        count.times do
          ts, type_id, value = binary.byteslice(offset, MEASUREMENT_SIZE).unpack('VCe')
          measurements << { epoch: ts, measurement_type_id: type_id, value: value }
          offset += MEASUREMENT_SIZE
        end
        measurements
      end

      def validate_checksum!(binary)
        expected_xor = binary.byteslice(0, binary.bytesize - 1).bytes.inject(0, :^)
        actual_xor = binary.bytes.last
        raise ParseError, 'invalid checksum' unless actual_xor == expected_xor
      end
    end
  end
end
