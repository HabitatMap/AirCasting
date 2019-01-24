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

export class Session {
  constructor(session) {
    this.session = session;
  };

  roundedAverage() {
    return Math.round(this.session.average)
  };

  average() {
    return this.session.average
  };

  selectedSensorUnit(selectedSensor) {
    this.session.streams[selectedSensor]["unit_symbol"];
  };

  startingLatLng(selectedSensor) {
    const latitude = this.session.streams[selectedSensor]["start_latitude"];
    const longitude = this.session.streams[selectedSensor]["start_longitude"];
    return new google.maps.LatLng(latitude, longitude);
  };
}
