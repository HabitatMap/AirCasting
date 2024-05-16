class Sensor
  def self.aggregated
    [
      { sensor_name: "AirBeam-PM10", measurement_type: 'Particulate Matter', unit_symbol: 'µg/m³' },
      { sensor_name: "AirBeam-PM2.5", measurement_type: 'Particulate Matter', unit_symbol: 'µg/m³' },
      { sensor_name: "AirBeam-PM1", measurement_type: 'Particulate Matter', unit_symbol: 'µg/m³' },
      { sensor_name: "AirBeam-RH", measurement_type: 'Humidity', unit_symbol: '%' },
      { sensor_name: "AirBeam-F", measurement_type: 'Temperature', unit_symbol: 'F' },
    ]
  end

  def self.sensor_name(sensor_name)
    normalized_names = {
      'airbeam-pm10' => ['airbeam2-pm10', 'airbeam3-pm10'],
      'airbeam-pm2.5' => ['airbeam-pm', 'airbeam2-pm2.5', 'airbeam3-pm2.5', 'airbeammini-pm2.5'],
      'airbeam-pm1' => ['airbeam2-pm1', 'airbeam3-pm1', 'airbeammini-pm1'],
      'airbeam-rh' => ['airbeam3-rh', 'airbeam2-rh', 'airbeam-rh'],
      'airbeam-f' => ['airbeam3-f', 'airbeam2-f', 'airbeam-f'],
    }

    normalized_names.fetch(sensor_name.downcase, [sensor_name]).map(&:downcase)
  end
end
