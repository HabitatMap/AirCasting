module MobileSessions
  class Creator
    UnknownStreamTypeError = Class.new(StandardError)
    MissingThresholdsError = Class.new(StandardError)

    UUID_TAKEN_MESSAGE = 'A session with this uuid already exists'.freeze

    def call(data:, user:)
      return uuid_taken if uuid_taken?(data[:uuid])

      ActiveRecord::Base.transaction do
        device = find_or_create_device(data[:device], user)
        session = create_session(data, user, device)
        streams = create_streams(data, session)
        Success.new(session: session, streams: streams)
      end
    rescue MissingThresholdsError => e
      Failure.new(error_code: ErrorCodes::VALIDATION_ERROR, message: e.message)
    rescue UnknownStreamTypeError => e
      Failure.new(error_code: ErrorCodes::UNSUPPORTED_SENSOR_TYPE, message: e.message)
    rescue ActiveRecord::RecordInvalid => e
      # Two creates racing on one uuid can both clear the check above; the model
      # validation is the second line of defence (there is no unique index).
      return uuid_taken if uuid_taken_error?(e)

      Failure.new(error_code: ErrorCodes::INTERNAL_ERROR, message: e.message)
    rescue ActiveRecord::RecordNotFound => e
      Failure.new(error_code: ErrorCodes::INTERNAL_ERROR, message: e.message)
    rescue ActiveRecord::RecordNotUnique
      # Backstop for a constraint the contract should have caught (today: one
      # stream per sensor type). Deliberately generic — no raw database text.
      Failure.new(
        error_code: ErrorCodes::VALIDATION_ERROR,
        message: 'Request conflicts with an existing record',
      )
    end

    private

    def uuid_taken?(uuid)
      uuid.present? && Session.where('LOWER(uuid) = LOWER(?)', uuid).exists?
    end

    def uuid_taken_error?(error)
      error.record.is_a?(Session) && error.record.errors.of_kind?(:uuid, :taken)
    end

    def uuid_taken
      Failure.new(error_code: ErrorCodes::SESSION_UUID_TAKEN, message: UUID_TAKEN_MESSAGE)
    end

    def find_or_create_device(device_params, user)
      # Scoped to the caller: a mac_address identifies a device only within one
      # user's account (see Device).
      device =
        user.devices.find_or_initialize_by(
          mac_address: Device.normalize_mac_address(device_params[:mac_address]),
        )
      device.model = device_params[:model]
      device.name = device_params[:name] if device_params.key?(:name)
      device.save!
      device
    end

    def create_session(data, user, device)
      # Create is configuration only: start/end stay NULL until the first
      # measurements arrive (the measurements endpoint derives them from the
      # measurement bounds). A session without times is skipped by every map /
      # search query and is visible only to its owner.
      MobileSession.create!(
        uuid: data[:uuid],
        title: data[:title],
        latitude: data[:latitude],
        longitude: data[:longitude],
        user: user,
        device: device,
        time_zone: data[:time_zone],
        tag_list: SessionBuilder.normalize_tags(data[:tag_list]),
        contribute: data[:contribute],
        # Mobile sessions are always outdoor; the old API took this from the
        # client payload, which sent false (or nothing) for mobile.
        is_indoor: false,
      )
    end

    def create_streams(data, session)
      streams_repository = StreamsRepository.new

      data[:streams].map do |stream_params|
        canonical = Sensor.canonical_sensor_name(stream_params[:sensor_name])
        type_id = Sensor::CANONICAL_SENSOR_TYPE_IDS[canonical]
        raise UnknownStreamTypeError, "unsupported sensor: #{stream_params[:sensor_name]}" unless type_id

        unit_symbol = stream_params[:unit_symbol]
        threshold_set = resolve_threshold_set(canonical, unit_symbol, stream_params[:thresholds])

        stream = streams_repository.create!(
          params: {
            session: session,
            sensor_name: stream_params[:sensor_name],
            sensor_package_name: stream_package_name(session.device),
            unit_name: Sensor::CANONICAL_UNIT_NAMES[canonical],
            unit_symbol: unit_symbol,
            measurement_type: Sensor::CANONICAL_MEASUREMENT_TYPES[canonical],
            measurement_short_type: Sensor::CANONICAL_MEASUREMENT_SHORT_TYPES[canonical],
            threshold_set: threshold_set,
            sensor_type_id: type_id,
            min_latitude: data[:latitude],
            max_latitude: data[:latitude],
            min_longitude: data[:longitude],
            max_longitude: data[:longitude],
          },
        )

        {
          sensor_name: stream.sensor_name,
          sensor_type_id: stream.sensor_type_id,
        }
      end
    end

    # `<Model>:<mac>` is the shape every legacy row uses, and the
    # `Sessions::IndexInteractor` package-name filter lowercases everything after
    # the first separator, so the mac is stored lowercased here even though
    # `devices.mac_address` keeps its canonical upper-case form. Falls back to the
    # column default when a session has no device.
    def stream_package_name(device)
      return 'Builtin' unless device

      "#{device.model}:#{device.mac_address.downcase}"
    end

    # Threshold resolution, in order:
    #   1. values sent by the client — reused if an identical set already exists,
    #      which also matches the default row when the client sends default values
    #      (the lookup ignores `is_default`, exactly as the legacy upload did);
    #   2. the seeded default set for the sensor;
    #   3. neither — a client error, not a server fault.
    def resolve_threshold_set(canonical, unit_symbol, values)
      if values.present?
        return ThresholdSet.find_or_create_by!(
          sensor_name: canonical,
          unit_symbol: unit_symbol,
          threshold_very_low: values[:very_low],
          threshold_low: values[:low],
          threshold_medium: values[:medium],
          threshold_high: values[:high],
          threshold_very_high: values[:very_high],
        )
      end

      default = ThresholdSet.find_by(sensor_name: canonical, unit_symbol: unit_symbol, is_default: true)
      return default if default

      raise MissingThresholdsError,
            "no default thresholds exist for #{canonical} (#{unit_symbol}) — send `thresholds` for this stream"
    end
  end
end
