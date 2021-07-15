export const calculateBounds = (selectedSession) => {
  const stream = selectedSession.stream;
  if (stream) {
    return {
      north: stream.max_latitude,
      east: stream.max_longitude,
      south: stream.min_latitude,
      west: stream.min_longitude,
    };
  }

  return { north: -Infinity, east: -Infinity, south: Infinity, west: Infinity };
};
