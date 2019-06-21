import _ from "underscore";
import * as assets from "../../../assets";
import { drawNotes } from "../../../javascript/note";
import * as Session from "../../../javascript/values/session";

const locationMarkersByLevel = {
  1: assets.locationMarker1Path,
  2: assets.locationMarker2Path,
  3: assets.locationMarker3Path,
  4: assets.locationMarker4Path
};

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

      this.measurements(session).forEach(function(measurement, idx) {
        const marker = createMeasurementMarker(
          measurement,
          idx,
          heat,
          map,
          suffix
        );

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

const calculateHeatLevel = (heat, value) => heat.getLevel(value);

const createMeasurementMarker = (measurement, idx, heat, map, suffix) => {
  const roundedValue = Math.round(measurement.value);
  if (heat.outsideOfScope(roundedValue)) return;

  const level = calculateHeatLevel(heat, roundedValue);

  const marker = map.drawMarker({
    position: { lat: measurement.latitude, lng: measurement.longitude },
    title: roundedValue.toString() + suffix,
    zIndex: idx,
    icon: {
      anchor: new google.maps.Point(6, 6),
      size: new google.maps.Size(12, 12),
      url: locationMarkersByLevel[level]
    }
  });

  return marker;
};
