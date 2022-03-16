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
    {
      'AirBeam-PM10'.downcase => ['AirBeam2-PM10', 'AirBeam3-PM10'],
      'AirBeam-PM2.5'.downcase => ['AirBeam-PM', 'AirBeam2-PM2.5', 'AirBeam3-PM2.5'],
      'AirBeam-PM1'.downcase => ['AirBeam2-PM1', 'AirBeam3-PM1'],
      'AirBeam-RH'.downcase => ['AirBeam3-RH', 'AirBeam2-RH', 'AirBeam-RH'],
      'AirBeam-F'.downcase => ['AirBeam3-F', 'AirBeam2-F', 'AirBeam-F'],
    }.fetch(sensor_name.downcase, sensor_name.downcase)
  end
end
