namespace :sessions do
  task merge_airnow_sessions: [:environment] do
    user = User.find_by(username: "US EPA AirNow")

    if user && user.sessions.any?
      sessions_with_coordinates = user.sessions

      grouped_sessions = sessions_with_coordinates.group_by(&:title).select { |_, v| v.size > 1 }

      lat_lon_tolerance = 0.003

      grouped_sessions.each do |title, sessions|
        within_tolerance = true

        sessions.combination(2).each do |s1, s2|
          if (s1.latitude - s2.latitude).abs > lat_lon_tolerance || (s1.longitude - s2.longitude).abs > lat_lon_tolerance || (s1.latitude == s2.latitude && s1.longitude == s2.longitude)
            within_tolerance = false
            break
          end
        end

        sessions.combination(2).each do |s1, s2|
          if (s1.latitude == s2.latitude && s1.longitude == s2.longitude)
            within_tolerance = false
            break
          end
        end

        if within_tolerance
          newest_session = sessions.max_by(&:last_measurement_at)
          newest_date = newest_session.last_measurement_at
          newest_session_id = newest_session.id

          oldest_session = sessions.min_by(&:last_measurement_at)
          oldest_date = oldest_session.last_measurement_at
          oldest_session_id = oldest_session.id

          sensors = []
          sessions.each do |session|
            session.streams.each do |stream|
              sensors << stream.sensor_name
            end
          end

          sensors = sensors.uniq

          sensors.each do |sensor|
            sensor_sessions = sessions.select { |session| session.streams.any? { |stream| stream.sensor_name == sensor } }
            newest_sensor_session = sensor_sessions.max_by(&:last_measurement_at)
            newest_sensor_stream_id = newest_sensor_session.streams.first.id

            oldest_sensor_session = sensor_sessions.min_by(&:last_measurement_at)
            oldest_sensor_stream_id = oldest_sensor_session.streams.first
            newest_sensor_session.update(start_time_local: oldest_sensor_session.measurements.first.time)

            sensor_sessions.each do |session|
              if session.streams.first.id != newest_sensor_stream_id
                puts "---------------------------------------------------------------------------"
                puts "Updating session: #{session.id}, title: #{session.title}"
                measurements_to_update = Measurement.where(stream_id: session.streams.first.id)
                puts "Updating measurements for session: #{session.id}"
                puts "Measurements to update: #{measurements_to_update}"
                measurements_to_update.update_all(stream_id: newest_sensor_stream_id)

                stream_daily_averages_to_update = StreamDailyAverage.where(stream_id: session.streams.first.id)
                puts "Updating stream daily averages for session: #{session.id}"
                puts "Stream daily averages to update: #{stream_daily_averages_to_update}"
                stream_daily_averages_to_update.update_all(stream_id: newest_sensor_stream_id)
              end
            end
          end

          puts "Group: #{title} - Newest measurement date: #{newest_date}, Newest Session ID: #{newest_session_id}, Oldest measurement date: #{oldest_date}, Oldest Session ID: #{oldest_session_id}"
        end
      end


      # delete empty streams

      session_ids = sessions_with_coordinates.pluck(:id)

      Stream.includes(:measurements)
      .where(session_id: session_ids)
      .where(measurements: { id: nil })
      .destroy_all
    end
  end
end
