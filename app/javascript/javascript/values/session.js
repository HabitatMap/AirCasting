export const formatSessionForList = session => ({
  title: session.title || "unnamed",
  username: session.username,
  id: session.id,
  startTime: session.startTime,
  endTime: session.endTime,
  shortTypes: session.shortTypes,
  // `stream.average_value` for mobile sessions
  // `session.last_hour_average` for active fixed sessions
  // dormant fixed sessions do not have average
  // The `hasOwnProperty` check is needed because 0 is falsy in JS
  average:
    session.type === "MobileSession"
      ? session.selectedStream.average_value
      : session.last_hour_average,
  // marker location for mobile sessions is based on the location of first measurement for a given stream
  // for fixed sessions location is constant so and stored on the session directly
  location: {
    lat: session.selectedStream.start_latitude || session.latitude,
    lng: session.selectedStream.start_longitude || session.longitude
  }
});

const average = (session, selectedSensor) =>
  session.streams[selectedSensor].average_value;

const lastHourAverage = session => session.last_hour_average;

export const averageValueAndUnit = (session, selectedSensor) =>
  roundedAverage(session, selectedSensor) +
  " " +
  selectedSensorUnit(session, selectedSensor);

export const lastHourAverageValueAndUnit = (session, selectedSensor) =>
  lastHourRoundedAverage(session) +
  " " +
  selectedSensorUnit(session, selectedSensor);

export const id = session => session.id;

export const startingLatLng = (session, selectedSensor) => {
  return {
    lat: () => startingLat(session, selectedSensor),
    lng: () => startingLng(session, selectedSensor)
  };
};

export const latLng = session => {
  return { lat: () => session.latitude, lng: () => session.longitude };
};

const startingLat = (session, selectedSensor) =>
  session.streams[selectedSensor].start_latitude;

const startingLng = (session, selectedSensor) =>
  session.streams[selectedSensor].start_longitude;

export const roundedAverage = (session, selectedSensor) =>
  Math.round(average(session, selectedSensor));

export const lastHourRoundedAverage = session =>
  Math.round(lastHourAverage(session));

const selectedSensorUnit = (session, selectedSensor) =>
  session.streams[selectedSensor].unit_symbol;
