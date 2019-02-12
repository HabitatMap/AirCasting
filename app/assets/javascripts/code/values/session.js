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

export const average = (session, selectedSensor) => session.streams[selectedSensor].average_value;

export const lastHourAverage = session => session.last_hour_average;

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

const roundedAverage = (session, selectedSensor) => Math.round(average(session, selectedSensor));

const lastHourRoundedAverage = session => Math.round(lastHourAverage(session));

const selectedSensorUnit = (session, selectedSensor) => session.streams[selectedSensor].unit_symbol;
