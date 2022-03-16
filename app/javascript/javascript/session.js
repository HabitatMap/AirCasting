export const formatSessionForList = (session) => ({
  title: session.title || "unnamed",
  username: session.username,
  id: session.id,
  startTime: session.startTime,
  endTime: session.endTime,
  shortTypes: session.shortTypes,
  streamId: session.stream.id,
  average:
    session.type === "MobileSession"
      ? session.stream.average_value // for mobile sessions
      : session.last_measurement_value, // for active fixed sessions
      // dormant fixed sessions do not have average
  // marker location for mobile sessions is based on the location of first measurement for a given stream
  // for fixed sessions location is constant so and stored on the session directly
  location: {
    lat: session.stream.start_latitude || session.latitude,
    lng: session.stream.start_longitude || session.longitude,
  },
});

const average = (session) => session.stream.average_value;

const lastMeasurementValue = (session) => session.last_measurement_value;

export const averageValueAndUnit = (session) =>
  roundedAverage(session) +
  " " +
  selectedSensorUnit(session);

export const lastMeasurementValueAndUnit = (session,) =>
  lastMeasurementRoundedValue(session) +
  " " +
  selectedSensorUnit(session);

export const streamId = (session) => session.stream.id;

export const startingLatLng = (session) => {
  return {
    lat: () => startingLat(session),
    lng: () => startingLng(session),
  };
};

export const latLng = (session) => {
  return { lat: () => session.latitude, lng: () => session.longitude };
};

const startingLat = (session) => session.stream.start_latitude;

const startingLng = (session) => session.stream.start_longitude;

export const roundedAverage = (session) =>
  Math.round(average(session));

export const lastMeasurementRoundedValue = (session) =>
  Math.round(lastMeasurementValue(session));

const selectedSensorUnit = (session) => session.stream.unit_symbol;
