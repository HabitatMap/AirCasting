import _ from "underscore";
const note = process.env.NODE_ENV === "test" ? "" : require("./note");
const drawNotes = note.drawNotes;
import * as Session from "./session";
import { locationMarkersByLevel } from "./theme";
import heat from "./heat";
import map from "./map";

export const drawSession = () => {
  let DrawSession = function() {};

  DrawSession.prototype = {
    drawMobileSession: function(session, drawSessionStartingMarker) {
      if (!session) {
        return;
      }

      drawSessionStartingMarker(session);

      const suffix = " " + session.unit_symbol;
      let points = [];

      this.measurements(session).forEach(function(measurement, idx) {
        createMeasurementMarker(measurement, idx, map, suffix);
        points.push(measurement);
      });

      drawNotes(session.notes || [], map, Session.startingLatLng(session));
      window.__map.polylines.push(map.drawLine(points));
    },

    measurements: function(session) {
      if (!session) {
        return [];
      }
      return session.stream.measurements;
    }
  };

  return new DrawSession();
};

const calculateHeatLevel = value => heat.getLevel(value);

const createMeasurementMarker = (measurement, idx, map, suffix) => {
  const roundedValue = Math.round(measurement.value);
  if (heat.outsideOfScope(roundedValue)) return;

  const level = calculateHeatLevel(roundedValue);

  const marker = map.drawMarker({
    position: { lat: measurement.latitude, lng: measurement.longitude },
    title: roundedValue.toString() + suffix,
    zIndex: idx,
    icon: {
      anchor: new google.maps.Point(6, 6),
      size: new google.maps.Size(12, 12),
      url: locationMarkersByLevel()[level]
    }
  });

  return marker;
};

export default drawSession;
