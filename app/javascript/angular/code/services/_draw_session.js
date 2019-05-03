import _ from "underscore";
import { removeMarker } from "./google/_map";

export const drawSession = (sensors, map, heat, note, empty) => {
  var DrawSession = function() {};

  DrawSession.prototype = {
    drawMobileSession: function(session, drawSessionStartingMarker) {
      if (!session || !session.loaded || !sensors.anySelected()) {
        return;
      }

      drawSessionStartingMarker(session, sensors.selectedSensorName());

      var suffix = " " + sensors.anySelected().unit_symbol;
      var points = [];

      this.measurements(session).forEach(function(measurement, idx) {
        const marker = createMeasurementMarker(
          measurement,
          idx,
          heat,
          map,
          suffix
        );

        session.markers.push(marker);
        points.push(measurement);
      });

      (session.notes || []).forEach(function(noteItem, idx) {
        session.noteDrawings.push(note.drawNote(noteItem, idx));
      });
      session.lines.push(map.drawLine(points));
    },

    undoDraw: function(session, mapPosition) {
      (session.markers || []).forEach(function(marker) {
        removeMarker(marker);
      });
      session.markers = [];

      (session.lines || []).forEach(function(line) {
        removeMarker(line);
      });
      session.lines = [];

      (session.noteDrawings || []).forEach(function(noteItem) {
        removeMarker(noteItem);
      });
      session.noteDrawings = [];

      if (mapPosition) {
        map.fitBounds(mapPosition.bounds, mapPosition.zoom);
      }
    },

    clear: function(sessions) {
      _(sessions).each(_(this.undoDraw).bind(this));
    },

    measurementsForSensor: function(session, sensor_name) {
      if (!session.streams[sensor_name]) {
        return empty.array;
      }
      return session.streams[sensor_name].measurements;
    },

    measurements: function(session) {
      if (!session) {
        return empty.array;
      }
      if (!sensors.anySelected()) {
        return empty.array;
      }
      return this.measurementsForSensor(
        session,
        sensors.anySelected().sensor_name
      );
    }
  };
  return new DrawSession();
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
    icon: "/assets/location_marker" + level + ".svg"
  });

  return marker;
};
