module Explore
  # The AirBeam model behind a fixed session, for the station detail endpoint.
  #
  # The model only. Never `devices.name`, which is the owner's own label for
  # their device, and never the MAC address that sensor_package_name carries
  # next to the model — neither belongs in a public response.
  #
  # `sessions.device_id` is recent wiring, so most sessions have no device row
  # and both fallbacks read what the stream itself recorded:
  #
  #   1. sensor_package_name, written as "<model>:<mac>" by the v3 creator
  #      (FixedSessions::Creator#stream_package_name). The literal 'Builtin' is
  #      its placeholder for "no device row" and carries no colon, so it falls
  #      through rather than being reported as a model.
  #   2. the sensor_name prefix — every AirBeam sensor name is "<model>-<type>",
  #      see Sensor::CANONICAL_SENSOR_NAME_MAP. Only a known model is accepted,
  #      so an unrecognised prefix does not become a device name.
  #
  # Nil when none of the three answer. Showing no device is honest; one
  # showing 'Builtin' is not.
  module DeviceModel
    MODELS =
      Sensor::CANONICAL_SENSOR_NAME_MAP
        .keys
        .filter_map { |name| name.split('-').first if name.include?('-') }
        .uniq
        .freeze

    # `streams` are the session's rows as [sensor_package_name, sensor_name];
    # the first that answers wins, since a session's streams all come from the
    # one device.
    def self.call(device_model:, streams:)
      return device_model if device_model.present?

      streams.each do |package_name, sensor_name|
        model = from_package_name(package_name) || from_sensor_name(sensor_name)
        return model if model
      end

      nil
    end

    def self.from_package_name(value)
      model, mac = value.to_s.split(':', 2)

      model.presence if mac.present?
    end

    def self.from_sensor_name(value)
      prefix = value.to_s.split('-').first

      prefix if MODELS.include?(prefix)
    end

    private_class_method :from_package_name, :from_sensor_name
  end
end
