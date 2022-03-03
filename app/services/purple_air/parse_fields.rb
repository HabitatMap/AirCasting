module PurpleAir
  class ParseFields
    def initialize(field_names:, ordered_fields:, utc_to_local:)
      @field_names = field_names
      @ordered_fields = ordered_fields
      @utc_to_local = utc_to_local
    end

    def call(measurements_fields)
      measurements_fields.each_with_object([]) do |measurement_fields, acc|
        @measurement_fields = measurement_fields
        acc << measurement
      rescue InvalidField => e
        Rails.logger.warn "Invalid field #{e}: skipping #{measurement_fields}"
        # skip current and move to next
      end
    end

    private

    def measurement
      PurpleAir::Measurement.new(
        value: value,
        latitude: latitude,
        longitude: longitude,
        time_local: time_local,
        time_utc: time_utc,
        title: title
      )
    end

    def value
      field_at!(@field_names[:value])
    end

    def latitude
      to_big_decimal(field_at!(@field_names[:latitude]))
    end

    def longitude
      to_big_decimal(field_at!(@field_names[:longitude]))
    end

    def time_utc
      DateTime.strptime(field_at!(@field_names[:last_seen]).to_s, '%s')
    end

    def time_local
      @utc_to_local.call(time_utc, latitude, longitude)
    end

    def title
      name = field_at!(@field_names[:name])
      sensor_index = field_at!(@field_names[:sensor_index])
      "#{name} (#{sensor_index})"
    end

    def field_at!(name)
      field = field_at(name)
      raise InvalidField.new("#{name} nil") if field.nil?
      field
    end

    def field_at(name)
      index = @ordered_fields.find_index { |x| x == name }
      @measurement_fields.fetch(index)
    end

    def to_big_decimal(number)
      BigDecimal(number.to_s).round(9)
    end
  end
end
