module MobileSessions
  module BinaryProtocol
    # Binary frame for AirBeam MOBILE measurements. Extends the fixed frame with
    # per-point location. No milliseconds — mobile records at interval sampling
    # (1s / 5s / 1min / 5min / 10min), so sub-second ordering is never needed.
    #
    #   uint32 BE epoch | uint8 type_id | float32 BE value | float64 BE lat | float64 BE lng
    class Parser
      MAGIC = "\xAB\xBA".b
      HEADER_SIZE = 4  # 2 bytes magic + 2 bytes uint16 count
      MEASUREMENT_SIZE = 25 # 4 epoch + 1 type_id + 4 value + 8 lat + 8 lng

      # Ten minutes of 1 Hz sampling across the five streams an AirBeam 3 records
      # — the densest setup currently in the field. A client with more to send
      # splits it across requests; each one is stored on its own, and resends are
      # idempotent, so chunking costs nothing.
      MAX_MEASUREMENTS = 3_000
      MAX_PAYLOAD_SIZE = HEADER_SIZE + (MAX_MEASUREMENTS * MEASUREMENT_SIZE) + 1 # 75_005 bytes

      # An AirBeam whose RTC never got set sends 1970 or 2000 epochs. Those pass a
      # zero check, get stored, and drag `start_time_local` back with them — and
      # since session bounds only ever widen after the first batch, the session
      # never recovers and every duration or range query over it is wrong. This
      # protocol did not exist before 2020, so nothing legitimate predates it.
      MIN_EPOCH = Time.utc(2020, 1, 1).to_i
      MAX_EPOCH_SKEW = 86_400 # a phone clock may run ahead; a day is generous

      module ErrorCodes
        PAYLOAD_TOO_SHORT       = 'payload_too_short'
        PAYLOAD_TOO_LARGE       = 'payload_too_large'
        INVALID_MAGIC_BYTES     = 'invalid_magic_bytes'
        EMPTY_MEASUREMENT_COUNT = 'empty_measurement_count'
        PAYLOAD_SIZE_MISMATCH   = 'payload_size_mismatch'
        INVALID_EPOCH           = 'invalid_epoch'
        INVALID_VALUE           = 'invalid_value'
        INVALID_LOCATION        = 'invalid_location'
        INVALID_CHECKSUM        = 'invalid_checksum'
      end

      class ParseError < StandardError
        attr_reader :error_code, :measurement_count

        def initialize(error_code, message, measurement_count: nil)
          super(message)
          @error_code = error_code
          @measurement_count = measurement_count
        end
      end

      def call(binary)
        raise ParseError.new(ErrorCodes::PAYLOAD_TOO_SHORT, 'payload too short') if binary.bytesize < HEADER_SIZE + 1

        # Guarded here as well as in the controller: the controller rejects on
        # Content-Length before reading the body, which a chunked request does not
        # carry. The parser does not get to trust its caller either way.
        raise ParseError.new(ErrorCodes::PAYLOAD_TOO_LARGE, "payload exceeds #{MAX_PAYLOAD_SIZE} bytes") if binary.bytesize > MAX_PAYLOAD_SIZE

        magic, count = binary.unpack('a2n')
        raise ParseError.new(ErrorCodes::INVALID_MAGIC_BYTES, 'magic bytes are not 0xAB 0xBA') unless magic == MAGIC
        raise ParseError.new(ErrorCodes::EMPTY_MEASUREMENT_COUNT, 'measurement count is zero') if count.zero?
        raise ParseError.new(ErrorCodes::PAYLOAD_TOO_LARGE, "measurement count exceeds #{MAX_MEASUREMENTS}", measurement_count: count) if count > MAX_MEASUREMENTS

        raise ParseError.new(ErrorCodes::PAYLOAD_TOO_SHORT, 'payload too short', measurement_count: count) if binary.bytesize < HEADER_SIZE + MEASUREMENT_SIZE + 1

        expected_size = HEADER_SIZE + (count * MEASUREMENT_SIZE) + 1
        raise ParseError.new(ErrorCodes::PAYLOAD_SIZE_MISMATCH, "payload size mismatch: expected #{expected_size} bytes, got #{binary.bytesize}", measurement_count: count) unless binary.bytesize == expected_size

        measurements = parse_measurements(binary, count)
        validate_checksum!(binary, count)

        measurements
      end

      private

      def parse_measurements(binary, count)
        measurements = []
        offset = HEADER_SIZE
        count.times do |i|
          ts, type_id, value, latitude, longitude =
            binary.byteslice(offset, MEASUREMENT_SIZE).unpack('NCgGG')

          raise ParseError.new(ErrorCodes::INVALID_EPOCH, "invalid epoch in frame #{i}: must be greater than zero", measurement_count: count) if ts.zero?
          raise ParseError.new(ErrorCodes::INVALID_EPOCH, "invalid epoch in frame #{i}: implausibly far in the past", measurement_count: count) if ts < MIN_EPOCH
          raise ParseError.new(ErrorCodes::INVALID_EPOCH, "invalid epoch in frame #{i}: implausibly far in the future", measurement_count: count) if ts > Time.current.to_i + MAX_EPOCH_SKEW
          raise ParseError.new(ErrorCodes::INVALID_VALUE, "invalid value in frame #{i}: not a finite number", measurement_count: count) unless value.finite?
          raise ParseError.new(ErrorCodes::INVALID_LOCATION, "invalid location in frame #{i}: coordinates out of range", measurement_count: count) unless valid_location?(latitude, longitude)

          measurements << {
            epoch: ts,
            sensor_type_id: type_id,
            value: value,
            latitude: latitude,
            longitude: longitude,
          }
          offset += MEASUREMENT_SIZE
        end
        measurements
      end

      def valid_location?(latitude, longitude)
        latitude.finite? && longitude.finite? &&
          latitude.between?(-90, 90) && longitude.between?(-180, 180)
      end

      def validate_checksum!(binary, count)
        expected_xor = binary.byteslice(0, binary.bytesize - 1).bytes.inject(0, :^)
        actual_xor = binary.bytes.last
        raise ParseError.new(ErrorCodes::INVALID_CHECKSUM, 'XOR checksum does not match payload', measurement_count: count) unless actual_xor == expected_xor
      end
    end
  end
end
