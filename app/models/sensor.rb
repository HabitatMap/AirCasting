class Sensor
  CANONICAL_SENSOR_NAME_MAP = {
    'AirBeam-PM10' => 'AirBeam-PM10',
    'AirBeam2-PM10' => 'AirBeam-PM10',
    'AirBeam3-PM10' => 'AirBeam-PM10',
    'AirBeamMini-PM10' => 'AirBeam-PM10',
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
    'AirBeamMini-RH' => 'AirBeam-RH',
    'AirBeam-F' => 'AirBeam-F',
    'AirBeam2-F' => 'AirBeam-F',
    'AirBeam3-F' => 'AirBeam-F',
    'AirBeamMini-F' => 'AirBeam-F',
  }

  # Globally stable sensor_type_id values for standard AirBeam sensor types.
  # Configured in AirBeam on creating new sessions— never change existing values, only append new ones.
  # Any AirBeam model using the binary protocol (POST /api/v3/fixed_sessions) can rely on these.
  CANONICAL_SENSOR_TYPE_IDS = {
    'AirBeam-PM1'   => 1,
    'AirBeam-PM2.5' => 2,
    'AirBeam-PM10'  => 3,
    'AirBeam-RH'    => 4,
    'AirBeam-F'     => 5,
  }.freeze

  # unit_symbol for ThresholdSet lookup per canonical sensor name.
  CANONICAL_UNIT_SYMBOLS = {
    'AirBeam-PM1'   => 'µg/m³',
    'AirBeam-PM2.5' => 'µg/m³',
    'AirBeam-PM10'  => 'µg/m³',
    'AirBeam-RH'    => '%',
    'AirBeam-F'     => 'F',
  }.freeze

  # measurement_type string per canonical sensor name.
  CANONICAL_MEASUREMENT_TYPES = {
    'AirBeam-PM1'   => 'Particulate Matter',
    'AirBeam-PM2.5' => 'Particulate Matter',
    'AirBeam-PM10'  => 'Particulate Matter',
    'AirBeam-RH'    => 'Humidity',
    'AirBeam-F'     => 'Temperature',
  }.freeze

  # unit_name per canonical sensor name (required by Stream model).
  CANONICAL_UNIT_NAMES = {
    'AirBeam-PM1'   => 'micrograms per cubic meter',
    'AirBeam-PM2.5' => 'micrograms per cubic meter',
    'AirBeam-PM10'  => 'micrograms per cubic meter',
    'AirBeam-RH'    => 'percent',
    'AirBeam-F'     => 'degrees Fahrenheit',
  }.freeze

  # measurement_short_type per canonical sensor name (required by Stream model).
  CANONICAL_MEASUREMENT_SHORT_TYPES = {
    'AirBeam-PM1'   => 'PM',
    'AirBeam-PM2.5' => 'PM',
    'AirBeam-PM10'  => 'PM',
    'AirBeam-RH'    => 'RH',
    'AirBeam-F'     => 'F',
  }.freeze

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
