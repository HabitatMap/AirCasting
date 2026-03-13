class StationMeasurementsRepository
  def last_2_days(station_stream_id:)
    StationMeasurement
      .where(station_stream_id: station_stream_id)
      .where(
        "measured_at >= ((SELECT MAX(measured_at) FROM station_measurements WHERE station_stream_id = ?) - INTERVAL '2 days')",
        station_stream_id,
      )
      .order(:measured_at)
  end
end
