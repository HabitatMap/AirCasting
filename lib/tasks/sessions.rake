namespace :sessions do
  desc 'Reset Counters for sessions'
  task reset_counters: [:environment] do
    sum = Session.count
    idx = 0
    puts "#{sum} sessions to update:"
    Session.all.each do |session|
      session.measurements_count = session.measurements.count
      session.save! if session.measurements_count_changed?
      idx = idx + 1
      puts "#{sum - idx} sessions left"
    end
    sum = Stream.count
    idx = 0
    puts "#{sum} streams to update:"
    Stream.all.each do |stream|
      stream.measurements_count = stream.measurements.count
      stream.save! if stream.measurements_count_changed?
      idx = idx + 1
      puts "#{sum - idx} streams left"
    end
  end

  desc 'Export mobile session aggregated data to CSV'
  task export_mobile_sessions: [:environment] do
    CSV.open("data-#{SecureRandom.uuid}.csv", 'wb') do |csv|
      csv << [
        'stream id',
        'start time',
        'end time',
        'amount of measurements',
        'min latitude',
        'max latitude',
        'min longitude',
        'max longitude',
        'average',
        'unit of measurement',
        'measurement type',
      ]
      streams =
        Stream
          .joins(:session)
          .where(sessions: { type: 'MobileSession' })
          .includes(:session)
      puts "Processing #{streams.count} streams."
      streams.find_each do |stream|
        csv << [
          stream.id,
          stream.session.start_time_local.strftime('%Y-%m-%dT%H:%M:%S'),
          stream.session.end_time_local.strftime('%Y-%m-%dT%H:%M:%S'),
          stream.measurements.count,
          stream.min_latitude,
          stream.max_latitude,
          stream.min_longitude,
          stream.max_longitude,
          stream.average_value,
          stream.unit_symbol,
          stream.measurement_type,
        ]
        putc '.'
      end
      puts
      puts 'Done!'
    end
  end

  desc 'Export pm2.5 stream data to CSV'
  task export_pm2_point_5_stream_data: [:environment] do
    CSV.open("data-#{SecureRandom.uuid}.csv", 'wb') do |csv|
      csv << [
        'stream id',
        'profile name',
        'session name',
        'session UUID',
        'measurement type',
        'unit of measurement',
        'start time',
        'end time',
        'number of measurements',
        'average session measurement',
        'min latitude',
        'max latitude',
        'min longitude',
        'max longitude',
      ]
      puts 'Starting processing streams.'

      Stream
        .includes(session: :user)
        .joins(session: :user)
        .where(
          sensor_name: %w[
            AirBeam-PM
            AirBeam2-PM2.5
            AirBeam3-PM2.5
            AirBeamMini-PM2.5
          ],
        )
        .find_each do |stream|
          csv << [
            stream.id,
            stream.session.user.username,
            stream.session.title,
            stream.session.uuid,
            stream.measurement_type,
            stream.unit_symbol,
            stream.session.start_time_local.strftime('%Y-%m-%dT%H:%M:%S'),
            stream.session.end_time_local.strftime('%Y-%m-%dT%H:%M:%S'),
            stream.measurements_count,
            stream.average_value,
            stream.min_latitude,
            stream.max_latitude,
            stream.min_longitude,
            stream.max_longitude,
          ]
          putc '.'
        end
      puts
      puts 'Done!'
    end
  end
end
