module MobileSessions
  # Partial update for a mobile session: rename, tags, notes, delete streams, and
  # add/update the AirBeam (device) info. Only the provided fields change; the
  # session version is bumped on every update so other devices re-fetch.
  class Updater

    def call(session:, data:)
      ActiveRecord::Base.transaction do
        session.title = data[:title] if data.key?(:title)
        session.tag_list = SessionBuilder.normalize_tags(data[:tag_list]) if data.key?(:tag_list)
        update_device(session, data[:device]) if data.key?(:device)
        delete_flagged_streams(session, data[:streams]) if data.key?(:streams)
        reconcile_notes(session, data[:notes]) if data.key?(:notes)
        session.version = session.version.to_i + 1
        session.save!
      end

      Success.new(session: session)
    rescue ActiveRecord::RecordInvalid => e
      # The invalid data came from the client payload (note/device/stream fields),
      # so this is a validation error, not an internal one.
      Failure.new(error_code: ErrorCodes::VALIDATION_ERROR, message: e.message)
    end

    private

    def update_device(session, device_params)
      return if device_params.blank?
      # Nothing to attach to: no existing device and no mac_address to identify one.
      return if device_params[:mac_address].blank? && session.device.nil?

      mac_address = Device.normalize_mac_address(device_params[:mac_address])

      device =
        if session.device && (mac_address.blank? || session.device.mac_address == mac_address)
          session.device
        else
          # Scoped to the session's owner — a request can never reach another
          # user's device row (see Device).
          session.user.devices.find_or_initialize_by(mac_address: mac_address)
        end

      device.model = device_params[:model] if device_params[:model].present?
      device.name = device_params[:name] if device_params.key?(:name)
      device.save!
      session.device = device
    end

    def delete_flagged_streams(session, streams)
      streams.each do |stream_data|
        next unless stream_data[:deleted]

        scope = session.streams.where(sensor_name: stream_data[:sensor_name])
        scope = scope.where(sensor_package_name: stream_data[:sensor_package_name]) if stream_data[:sensor_package_name].present?
        scope.update_all(last_hourly_average_id: nil)
        scope.each(&:destroy)
      end
    end

    def reconcile_notes(session, notes)
      kept_numbers = notes.map { |note| note[:number] }
      session.notes.where.not(number: kept_numbers).destroy_all

      notes.each do |note_data|
        note = session.notes.find_by(number: note_data[:number])
        if note
          note.update!(note_data)
        else
          session.notes.create!(note_data)
        end
      end
    end
  end
end
