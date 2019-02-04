import _ from "underscore";

export const drawSession = (
  sensors,
  map,
  heat,
  note,
  empty
) => {
  var DrawSession = function() {
  };

  DrawSession.prototype = {
    drawMobileSession: function(session) {
      if(!session || !session.loaded || !sensors.anySelected()){
        return;
      }
      this.undoDraw(session);

      var suffix = ' ' + sensors.anySelected().unit_symbol;
      var points = [];

      this.measurements(session).forEach(function(measurement, idx){
        const marker = createMeasurementMarker(measurement, idx, heat, map, suffix);

        session.markers.push(marker);
        points.push(measurement);
      });

      (session.notes || []).forEach(function(noteItem, idx){
        session.noteDrawings.push(note.drawNote(noteItem, idx));
      });
      session.lines.push(map.drawLine(points));

      session.drawed = true;
    },

    drawFixedSession: function(session) {
      this.undoDraw(session);
      session.markers = [];
      session.noteDrawings = [];
      session.lines = [];

       if (!sensors.selected()) { return drawDefaultMarker(session, map) };

       if (session.last_hour_average === undefined) { return drawDefaultMarker(session, map) };

       if (heat.outsideOfScope(session.last_hour_average)) { return session.markers };

       return drawColorCodedMarker(session, map, heat)
    },

    undoDraw: function(session, mapPosition) {
      if(!session.drawed){
        return;
      }
      (session.markers || []).forEach(function(marker){
        map.removeMarker(marker);
      });
      session.markers = [];

      (session.lines || []).forEach(function(line){
        map.removeMarker(line);
      });
      session.lines = [];

      (session.noteDrawings || []).forEach(function(noteItem){
        map.removeMarker(noteItem);
      });
      session.noteDrawings = [];

      session.drawed = false;
      if(mapPosition){
        map.fitBounds(mapPosition.bounds, mapPosition.zoom);
      }
    },

    redraw: function(sessions) {
      this.clear();
      _(sessions).each(function(session) {
        if (session.type == 'MobileSession') {
          _(this.drawMobileSession(session));
        } else if (session.type == 'FixedSession') {
          _(this.drawFixedSession(session));
        } else return;
      }.bind(this));
    },

    clear: function(sessions) {
      _(sessions).each(_(this.undoDraw).bind(this));
    },

    clearOtherSessions: function(sessions, selectedSession) {
      sessions
      .filter(session => session !== selectedSession)
      .forEach(this.undoDraw)
    },

    measurementsForSensor: function(session, sensor_name){
      if (!session.streams[sensor_name]) { return empty.array; }
      return session.streams[sensor_name].measurements;
    },

    measurements: function(session){
      if (!session) { return empty.array; }
      if (!sensors.anySelected()) { return empty.array; }
      return this.measurementsForSensor(session, sensors.anySelected().sensor_name);
    }
  };
  return new DrawSession();
};

const drawDefaultMarker = (session, map) => {
  const level = 0;
  const markerOptions = {title: session.title, zIndex: 0};

  session.markers.push(map.drawMarkerOld(session, markerOptions, null, level));
  session.drawed = true;

  return session.markers;
};

const drawColorCodedMarker = (session, map, heat) => {
  const level = calculateHeatLevel(heat, session.last_hour_average);
  const markerOptions = {title: session.title, zIndex: 0};

  session.markers.push(map.drawMarkerOld(session, markerOptions, null, level));
  session.drawed = true;

  return session.markers;
};

const calculateHeatLevel = (heat, value) => heat.getLevel(value);

const createMeasurementMarker = (measurement, idx, heat, map, suffix) => {
  const roundedValue = Math.round(measurement.value);
  if (heat.outsideOfScope(roundedValue)) return;

  const level = calculateHeatLevel(heat, roundedValue);

  const marker = map.drawMarker({
    position: { lat: measurement.latitude, lng: measurement.longitude },
    title: roundedValue.toString() + suffix,
    zIndex: idx,
    icon: "/assets/marker"+ level + ".png"
  });

  return marker;
}
