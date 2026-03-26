class StationMeasurementsSerializer
  # time_zone must be an IANA timezone string (e.g. 'Europe/Warsaw', 'America/New_York').
  # We convert the UTC measured_at to local wall-clock time and then treat those
  # components as UTC, matching the AirBeam convention (fixed_measurements.time).
  def call(measurements, time_zone: 'UTC')
    measurements.map do |measurement|
      time = Utils.to_local_as_utc(measurement.measured_at, time_zone).to_i * 1_000
      { time: time, value: measurement.value }
    end
  end
end
