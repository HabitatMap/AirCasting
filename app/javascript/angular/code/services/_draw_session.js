import _ from "underscore";
import * as assets from "../../../assets";
import { drawNotes } from "../../../javascript/note";
import * as Session from "../../../javascript/values/session";

export const drawSession = (sensors, map, heat, empty) => {
  var DrawSession = function() {};

  DrawSession.prototype = {
    drawMobileSession: function(session, drawSessionStartingMarker) {
      if (!session || !sensors.anySelected()) {
        return;
      }

      const startingMarker = drawSessionStartingMarker(
        session,
        sensors.selectedSensorName()
      );

      var suffix = " " + sensors.anySelected().unit_symbol;
      var points = [];

      this.measurements(session).forEach(function(measurement) {
        const marker = createMeasurementMarker(measurement, heat, map, suffix);

        points.push(measurement);
      });

      drawNotes(
        session.notes || [],
        map,
        Session.startingLatLng(session, sensors.selectedSensorName())
      );
      window.__map.polylines.push(map.drawLine(points));
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

const calculateHeatLevel = (heat, value) => heat.levelName(value);

const createMeasurementMarker = (measurement, heat, map, suffix) => {
  const roundedValue = Math.round(measurement.value);
  if (heat.outsideOfScope(roundedValue)) return;

  const level = calculateHeatLevel(heat, roundedValue);
  const latLng = {
    lat: () => measurement.latitude,
    lng: () => measurement.longitude
  };

  const marker = map.drawMarkerWithoutLabel({
    object: { latLng, title: roundedValue.toString() + suffix },
    colorClass: level
  });

  return marker;
};
