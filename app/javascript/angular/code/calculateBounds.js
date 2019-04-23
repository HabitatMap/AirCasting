import { pixelsToLength } from "./mapsUtils.js";

// The graph is ~220px high. For whatever reason the OFFSET_IN_PIXEL
// must be 1000 to not have the session path covered by the graph.
const OFFSET_IN_PIXEL = 1000;

export const calculateBounds_ = pixelsToLength => (sensors, sessions, zoom) => {
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

  south = south - pixelsToLength(OFFSET_IN_PIXEL, zoom);

  if (!north) return;

  return {north, east, south, west};
};

export const calculateBounds = calculateBounds_(pixelsToLength);
