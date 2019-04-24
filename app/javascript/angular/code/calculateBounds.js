export const calculateBounds = (sensors, sessions) => {
  const maxLat = [];
  const minLat = [];
  const maxLong = [];
  const minLong = [];
  const sensor = sensors.anySelected();

  if (!sensor) return;

  sessions.forEach(function(session) {
    const stream = session.streams[sensor.sensor_name];
    if (!stream) return;

    maxLat.push(stream.max_latitude);
    minLat.push(stream.min_latitude);
    maxLong.push(stream.max_longitude);
    minLong.push(stream.min_longitude);
  });

  var north = Math.max.apply(null, maxLat);
  var south = Math.min.apply(null, minLat);
  var west = Math.min.apply(null, minLong);
  var east = Math.max.apply(null, maxLong);

  if (!north) return;

  return { north, east, south, west };
};
