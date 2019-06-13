import _ from "underscore";
import { removeMarker } from "./google/_map.js";
import * as assets from "../../../assets";
import { drawNotes } from "../../../javascript/note";

const locationMarkersByLevel = {
  1: assets.locationMarker1Path,
  2: assets.locationMarker2Path,
  3: assets.locationMarker3Path,
  4: assets.locationMarker4Path
};

export const drawSession = (sensors, map, heat, empty) => {
  var DrawSession = function() {};

  const drawnObjects = { markers: [], lines: [], noteDrawings: [] };

  DrawSession.prototype = {
    drawMobileSession: function(session, drawSessionStartingMarker) {
      if (!session || !sensors.anySelected()) {
        return;
      }

      const startingMarker = drawSessionStartingMarker(
        session,
        sensors.selectedSensorName()
      );
      drawnObjects.markers.push(startingMarker);

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

        drawnObjects.markers.push(marker);
        points.push(measurement);
      });

      drawnObjects.noteDrawings = drawNotes(session.notes || [], map);
      drawnObjects.lines.push(map.drawLine(points));
    },

    undoDraw: function(session, mapPosition) {
      (session.markers || []).forEach(marker => {
        removeMarker(marker);
      });
      session.markers = [];

      (drawnObjects.markers || []).forEach(marker => {
        removeMarker(marker);
      });
      drawnObjects.markers = [];

      (drawnObjects.lines || []).forEach(line => {
        removeMarker(line);
      });
      drawnObjects.lines = [];

      (drawnObjects.noteDrawings || []).forEach(noteItem => {
        removeMarker(noteItem);
      });
      drawnObjects.noteDrawings = [];

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
    icon: {
      anchor: new google.maps.Point(6, 6),
      size: new google.maps.Size(12, 12),
      url: locationMarkersByLevel[level]
    }
  });

  return marker;
};
