module FixedSessions
  module AirBeamMini2
    class BinaryParser
      MAGIC = 'ABBA'
      HEADER_SIZE = 6  # 4 bytes magic + 2 bytes uint16 count
      MEASUREMENT_SIZE = 9  # 4 bytes uint32 epoch + 1 byte uint8 type_id + 4 bytes float32 value

      module ErrorCodes
        PAYLOAD_TOO_SHORT       = 'payload_too_short'
        INVALID_MAGIC_BYTES     = 'invalid_magic_bytes'
        EMPTY_MEASUREMENT_COUNT = 'empty_measurement_count'
        PAYLOAD_SIZE_MISMATCH   = 'payload_size_mismatch'
        INVALID_EPOCH           = 'invalid_epoch'
        INVALID_VALUE           = 'invalid_value'
        INVALID_CHECKSUM        = 'invalid_checksum'
      end

      class ParseError < StandardError
        attr_reader :error_code

        def initialize(error_code, message)
          super(message)
          @error_code = error_code
        end
      end

      def call(binary)
        raise ParseError.new(ErrorCodes::PAYLOAD_TOO_SHORT, 'payload too short') if binary.bytesize < HEADER_SIZE + 1

        magic, count = binary.unpack('a4n')
        raise ParseError.new(ErrorCodes::INVALID_MAGIC_BYTES, 'magic bytes are not ABBA') unless magic == MAGIC
        raise ParseError.new(ErrorCodes::EMPTY_MEASUREMENT_COUNT, 'measurement count is zero') if count.zero?

        raise ParseError.new(ErrorCodes::PAYLOAD_TOO_SHORT, 'payload too short') if binary.bytesize < HEADER_SIZE + MEASUREMENT_SIZE + 1

        expected_size = HEADER_SIZE + (count * MEASUREMENT_SIZE) + 1
        raise ParseError.new(ErrorCodes::PAYLOAD_SIZE_MISMATCH, "payload size mismatch: expected #{expected_size} bytes, got #{binary.bytesize}") unless binary.bytesize == expected_size

        measurements = parse_measurements(binary, count)
        validate_checksum!(binary)

        measurements
      end

      private

      def parse_measurements(binary, count)
        measurements = []
        offset = HEADER_SIZE
        count.times do |i|
          ts, type_id, value = binary.byteslice(offset, MEASUREMENT_SIZE).unpack('NCg')
          raise ParseError.new(ErrorCodes::INVALID_EPOCH, "invalid epoch in frame #{i}: must be greater than zero") if ts.zero?
          raise ParseError.new(ErrorCodes::INVALID_EPOCH, "invalid epoch in frame #{i}: implausibly far in the future") if ts > Time.current.to_i + 86_400
          raise ParseError.new(ErrorCodes::INVALID_VALUE, "invalid value in frame #{i}: not a finite number") unless value.finite?
          measurements << { epoch: ts, sensor_type_id: type_id, value: value }
          offset += MEASUREMENT_SIZE
        end
        measurements
      end

      def validate_checksum!(binary)
        expected_xor = binary.byteslice(0, binary.bytesize - 1).bytes.inject(0, :^)
        actual_xor = binary.bytes.last
        raise ParseError.new(ErrorCodes::INVALID_CHECKSUM, 'XOR checksum does not match payload') unless actual_xor == expected_xor
      end
    end
  end
end
