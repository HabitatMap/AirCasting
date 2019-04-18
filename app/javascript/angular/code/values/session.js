export const formatSessionForList = session => ({
  title: session.title || 'unnamed',
  username: session.is_indoor ? 'anonymous' : session.username,
  id: session.id,
  startTime: session.startTime,
  endTime: session.endTime,
  shortTypes: session.shortTypes,
  // average for mobile sessions, last_hour_average for streaming fixed sessions
  // non-streaming fixed sessions do not have average
  average: session.average || session.last_hour_average || null
});

const average = (session, selectedSensor) => session.streams[selectedSensor].average_value;

const lastHourAverage = session => session.last_hour_average;

export const averageValueAndUnit = (session, selectedSensor) => roundedAverage(session, selectedSensor) + " " + selectedSensorUnit(session, selectedSensor);

export const lastHourAverageValueAndUnit = (session, selectedSensor) => lastHourRoundedAverage(session) + " " + selectedSensorUnit(session, selectedSensor);

export const id = (session) => session.id

export const startingLatLng = (session, selectedSensor) => {
  return { lat: () => startingLat(session, selectedSensor), lng: () => startingLng(session, selectedSensor) }
};

export const latLng = (session) => {
  return { lat: () => session.latitude, lng: () => session.longitude }
};

const startingLat = (session, selectedSensor) => session.streams[selectedSensor].start_latitude;

const startingLng = (session, selectedSensor) => session.streams[selectedSensor].start_longitude;

export const roundedAverage = (session, selectedSensor) => Math.round(average(session, selectedSensor));

export const lastHourRoundedAverage = session => Math.round(lastHourAverage(session));

const selectedSensorUnit = (session, selectedSensor) => session.streams[selectedSensor].unit_symbol;
