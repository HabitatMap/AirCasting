class Sensor
  CANONICAL_SENSOR_NAME_MAP = {
    'AirBeam-PM10' => 'AirBeam-PM10',
    'AirBeam2-PM10' => 'AirBeam-PM10',
    'AirBeam3-PM10' => 'AirBeam-PM10',
    'AirBeam-PM2.5' => 'AirBeam-PM2.5',
    'AirBeam-PM' => 'AirBeam-PM2.5',
    'AirBeam2-PM2.5' => 'AirBeam-PM2.5',
    'AirBeam3-PM2.5' => 'AirBeam-PM2.5',
    'AirBeamMini-PM2.5' => 'AirBeam-PM2.5',
    'AirBeam-PM1' => 'AirBeam-PM1',
    'AirBeam2-PM1' => 'AirBeam-PM1',
    'AirBeam3-PM1' => 'AirBeam-PM1',
    'AirBeamMini-PM1' => 'AirBeam-PM1',
    'AirBeam-RH' => 'AirBeam-RH',
    'AirBeam2-RH' => 'AirBeam-RH',
    'AirBeam3-RH' => 'AirBeam-RH',
    'AirBeam-F' => 'AirBeam-F',
    'AirBeam2-F' => 'AirBeam-F',
    'AirBeam3-F' => 'AirBeam-F',
  }

  def self.aggregated
    [
      {
        sensor_name: 'AirBeam-PM10',
        measurement_type: 'Particulate Matter',
        unit_symbol: 'µg/m³',
      },
      {
        sensor_name: 'AirBeam-PM2.5',
        measurement_type: 'Particulate Matter',
        unit_symbol: 'µg/m³',
      },
      {
        sensor_name: 'AirBeam-PM1',
        measurement_type: 'Particulate Matter',
        unit_symbol: 'µg/m³',
      },
      {
        sensor_name: 'AirBeam-RH',
        measurement_type: 'Humidity',
        unit_symbol: '%',
      },
      {
        sensor_name: 'AirBeam-F',
        measurement_type: 'Temperature',
        unit_symbol: 'F',
      },
    ]
  end

  def self.sensor_name(sensor_name)
    normalized_names = {
      'airbeam-pm10' => %w[airbeam2-pm10 airbeam3-pm10],
      'airbeam-pm2.5' => %w[
        airbeam-pm
        airbeam2-pm2.5
        airbeam3-pm2.5
        airbeammini-pm2.5
      ],
      'airbeam-pm1' => %w[airbeam2-pm1 airbeam3-pm1 airbeammini-pm1],
      'airbeam-rh' => %w[airbeam3-rh airbeam2-rh airbeam-rh],
      'airbeam-f' => %w[airbeam3-f airbeam2-f airbeam-f],
    }

    normalized_names.fetch(sensor_name.downcase, [sensor_name]).map(&:downcase)
  end

  def self.canonical_sensor_name(sensor_name)
    CANONICAL_SENSOR_NAME_MAP[sensor_name] || sensor_name
  end
end
