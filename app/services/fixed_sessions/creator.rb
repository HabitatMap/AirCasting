module FixedSessions
  class Creator
    UnknownStreamTypeError = Class.new(StandardError)

    def call(data:, user:)
      params = data

      ActiveRecord::Base.transaction do
        device = Device.find_or_initialize_by(mac_address: params[:airbeam][:mac_address])
        device_attrs = { model: params[:airbeam][:model] }
        device_attrs[:name] = params[:airbeam][:name] if params[:airbeam].key?(:name)
        device.assign_attributes(device_attrs)
        device.save!

        time_zone = TimeZoneFinderWrapper.instance.time_zone_at(
          lat: params[:latitude],
          lng: params[:longitude],
        )
        url_token =
          TokenGenerator.new.generate_unique(5) do |t|
            !Session.exists?(url_token: t)
          end
        now = Time.current

        session =
          FixedSession.create!(
            uuid: params[:uuid],
            title: params[:title],
            latitude: params[:latitude],
            longitude: params[:longitude],
            user: user,
            device: device,
            time_zone: time_zone,
            url_token: url_token,
            start_time_local: now,
            end_time_local: now,
            is_indoor: false,
            contribute: params[:contribute],
          )

        stream_results =
          params[:streams].map do |stream_params|
            unit_symbol = stream_params[:unit]
            measurement_type = stream_params[:measurement_type]
            provided_type_id = stream_params[:measurement_type_id]

            canonical =
              if provided_type_id
                Sensor::CANONICAL_MEASUREMENT_TYPE_IDS.key(provided_type_id)
              else
                Sensor::CANONICAL_MEASUREMENT_TYPE_IDS.keys.find do |name|
                  Sensor::CANONICAL_UNIT_SYMBOLS[name] == unit_symbol &&
                    Sensor::CANONICAL_MEASUREMENT_TYPES[name] == measurement_type
                end
              end

            raise UnknownStreamTypeError, "unknown stream type: #{measurement_type} #{unit_symbol}" unless canonical

            measurement_type_id = Sensor::CANONICAL_MEASUREMENT_TYPE_IDS[canonical]

            threshold_set =
              ThresholdSet.find_by!(
                sensor_name: canonical,
                unit_symbol: unit_symbol,
                is_default: true,
              )

            Stream.create!(
              session: session,
              sensor_name: canonical,
              sensor_package_name: params[:airbeam][:mac_address],
              unit_name: Sensor::CANONICAL_UNIT_NAMES[canonical],
              unit_symbol: unit_symbol,
              measurement_type: measurement_type,
              measurement_short_type: Sensor::CANONICAL_MEASUREMENT_SHORT_TYPES[canonical],
              threshold_set: threshold_set,
              measurement_type_id: measurement_type_id,
              min_latitude: params[:latitude],
              max_latitude: params[:latitude],
              min_longitude: params[:longitude],
              max_longitude: params[:longitude],
            )

            { measurement_type: measurement_type, unit: unit_symbol, measurement_type_id: measurement_type_id }
          end

        Success.new(session: session, streams: stream_results)
      end
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotFound, UnknownStreamTypeError => e
      Failure.new(base: [e.message])
    end
  end
end
