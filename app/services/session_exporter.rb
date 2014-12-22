class SessionExporter
  def initialize(session)
    @session = session
  end

  def export
    CSV.generate do |csv|
      @session.streams.each do |stream|
        csv << %w( sensor:model sensor:package sensor:capability sensor:units )
        csv << [ stream.sensor_name, stream.sensor_package_name, stream.measurement_type, stream.unit_name ]

        csv << %w( Timestamp geo:lat geo:long Value )
        stream.measurements.each do |measurement|
          timezone = ActiveSupport::TimeZone[measurement.timezone_offset]
          timestamp = measurement.time.in_time_zone(timezone).iso8601(3) # e.g. 2014-12-15T17:15:45.341+0100

          csv << [ timestamp, measurement.latitude, measurement.longitude, measurement.value ]
        end
      end
    end
  end
end
