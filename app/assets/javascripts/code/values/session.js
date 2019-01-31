export const formatSessionForList = session => ({
  title: session.title || 'unnamed',
  username: session.is_indoor ? 'anonymous' : session.username,
  $selected: session.$selected,
  // `$selected` should be enough but for whatever reasons if that's
  // the only thing that changes it does not trigger a `watch`
  selected: session.$selected,
  id: session.id,
  timeframe: session.timeframe,
  shortTypes: session.shortTypes
});

export const average = session => session.average;

export const lastHourAverage = session => session.last_hour_average;

export const averageVauleAndUnit = (session, selectedSensor) => roundedAverage(session) + " " + selectedSensorUnit(session, selectedSensor);

export const lastHourAverageVauleAndUnit = (session, selectedSensor) => lastHourRoundedAverage(session) + " " + selectedSensorUnit(session, selectedSensor);

export const id = (session) => session.id

export const startingLatLng = (session, selectedSensor) => {
  return { lat: () => startingLat(session, selectedSensor), lng: () => startingLng(session, selectedSensor) }
};

export const latLng = (session) => {
  return { lat: () => session.latitude, lng: () => session.longitude }
};

const startingLat = (session, selectedSensor) => session.streams[selectedSensor].start_latitude;

const startingLng = (session, selectedSensor) => session.streams[selectedSensor].start_longitude;

const roundedAverage = session => Math.round(average(session));

const lastHourRoundedAverage = session => Math.round(lastHourAverage(session));

const selectedSensorUnit = (session, selectedSensor) => session.streams[selectedSensor].unit_symbol;
