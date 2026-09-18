module FixedSessions
  module BinaryProtocol
    class Parser
      MAGIC = "\xAB\xBA".b
      HEADER_SIZE = 4  # 2 bytes magic + 2 bytes uint16 count
      MEASUREMENT_SIZE = 9  # 4 bytes uint32 epoch + 1 byte uint8 type_id + 4 bytes float32 value

      # Three times the largest batch any shipped client sends, counted in frames:
      # 1000 from the Mini (autosync.rs clamps to 500 samples on free heap, two
      # sensors each) and 2000 from Android (BATCH_SIZE_MEASUREMENTS = 1000 x 2).
      MAX_MEASUREMENTS = 6_000
      MAX_PAYLOAD_SIZE = HEADER_SIZE + (MAX_MEASUREMENTS * MEASUREMENT_SIZE) + 1 # 54_005 bytes

      # A Mini with an unset RTC stamps frames near epoch 0 and uploads them when
      # WiFi returns: sensor_thread.rs reads SystemTime::now() ungated, and
      # main.rs only insists on a synced clock when WiFi is already up at session
      # start. Those frames are dropped rather than rejected — see `call`.
      MIN_EPOCH = Time.utc(2020, 1, 1).to_i
      MAX_EPOCH_SKEW = 86_400 # a device clock may run ahead; a day is generous

      module ErrorCodes
        PAYLOAD_TOO_SHORT       = 'payload_too_short'
        PAYLOAD_TOO_LARGE       = 'payload_too_large'
        INVALID_MAGIC_BYTES     = 'invalid_magic_bytes'
        EMPTY_MEASUREMENT_COUNT = 'empty_measurement_count'
        PAYLOAD_SIZE_MISMATCH   = 'payload_size_mismatch'
        INVALID_VALUE           = 'invalid_value'
        INVALID_CHECKSUM        = 'invalid_checksum'
      end

      # `skipped` carries one entry per dropped frame: { index:, epoch:, reason: }.
      Result = Struct.new(:measurements, :skipped, keyword_init: true)

      SKIPPED_TOO_OLD = 'epoch_before_2020'.freeze
      SKIPPED_TOO_NEW = 'epoch_in_the_future'.freeze

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

        # Also guarded in the controller, which rejects on Content-Length before
        # reading the body — a chunked request carries none.
        raise ParseError.new(ErrorCodes::PAYLOAD_TOO_LARGE, "payload exceeds #{MAX_PAYLOAD_SIZE} bytes") if binary.bytesize > MAX_PAYLOAD_SIZE

        magic, count = binary.unpack('a2n')
        raise ParseError.new(ErrorCodes::INVALID_MAGIC_BYTES, 'magic bytes are not 0xAB 0xBA') unless magic == MAGIC
        raise ParseError.new(ErrorCodes::EMPTY_MEASUREMENT_COUNT, 'measurement count is zero') if count.zero?
        # Before the size-mismatch check, or a lying header answers the misleading
        # `payload_size_mismatch`.
        raise ParseError.new(ErrorCodes::PAYLOAD_TOO_LARGE, "measurement count exceeds #{MAX_MEASUREMENTS}", measurement_count: count) if count > MAX_MEASUREMENTS

        raise ParseError.new(ErrorCodes::PAYLOAD_TOO_SHORT, 'payload too short', measurement_count: count) if binary.bytesize < HEADER_SIZE + MEASUREMENT_SIZE + 1

        expected_size = HEADER_SIZE + (count * MEASUREMENT_SIZE) + 1
        raise ParseError.new(ErrorCodes::PAYLOAD_SIZE_MISMATCH, "payload size mismatch: expected #{expected_size} bytes, got #{binary.bytesize}", measurement_count: count) unless binary.bytesize == expected_size

        # Frames are validated per frame and the bad ones dropped, never raised
        # on. A Mini only trims flash once the server answers 2xx (autosync.rs),
        # and it drains newest-first, so a refused batch is re-POSTed every loop
        # tick and the oldest frames — the ones a just-booted clock stamped 1970 —
        # are never cleared: the storage file can no longer empty. Android's BLE
        # sync is worse, the device has already wiped its flash, so a rejected
        # chunk is gone. The mobile parser rejects instead; no client calls it, so
        # it can afford strict semantics.
        result = parse_measurements(binary, count)
        validate_checksum!(binary, count)

        result
      end

      private

      def parse_measurements(binary, count)
        measurements = []
        skipped = []
        offset = HEADER_SIZE
        latest_acceptable = Time.current.to_i + MAX_EPOCH_SKEW

        count.times do |i|
          ts, type_id, value = binary.byteslice(offset, MEASUREMENT_SIZE).unpack('NCg')
          offset += MEASUREMENT_SIZE

          # A NaN value is a corrupt payload, not a clock the device cannot set,
          # and the checksum below would not always catch it.
          raise ParseError.new(ErrorCodes::INVALID_VALUE, "invalid value in frame #{i}: not a finite number", measurement_count: count) unless value.finite?

          if ts < MIN_EPOCH
            skipped << { index: i, epoch: ts, reason: SKIPPED_TOO_OLD }
          elsif ts > latest_acceptable
            skipped << { index: i, epoch: ts, reason: SKIPPED_TOO_NEW }
          else
            measurements << { epoch: ts, sensor_type_id: type_id, value: value }
          end
        end

        Result.new(measurements: measurements, skipped: skipped)
      end

      def validate_checksum!(binary, count)
        expected_xor = binary.byteslice(0, binary.bytesize - 1).bytes.inject(0, :^)
        actual_xor = binary.bytes.last
        raise ParseError.new(ErrorCodes::INVALID_CHECKSUM, 'XOR checksum does not match payload', measurement_count: count) unless actual_xor == expected_xor
      end
    end
  end
end
