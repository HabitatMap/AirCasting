export const calculateBounds = (sensors, selectedSession) => {
  const sensor = sensors.anySelected();
  if (!sensor) return;

  const stream = selectedSession.streams[sensor.sensor_name];
  if (stream) {
    return {
      north: stream.max_latitude,
      east: stream.max_longitude,
      south: stream.min_latitude,
      west: stream.min_longitude
    };
  }

  return { north: -Infinity, east: -Infinity, south: Infinity, west: Infinity };
};
