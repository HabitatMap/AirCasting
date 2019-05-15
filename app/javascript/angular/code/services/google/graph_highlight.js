import { removeMarker, drawMarker } from "./_map.js";
import * as assets from "../../../../assets";

let items = [];

export const hide = () => {
  items.forEach(item => {
    removeMarker(item.marker);
  });
  items = [];
};

export const show = points => {
  hide();
  points.forEach(point => {
    items.push({
      marker: drawMarker({
        position: { lat: point.latitude, lng: point.longitude },
        zIndex: 300000,
        icon: {
          anchor: new google.maps.Point(8, 8),
          size: new google.maps.Size(16, 16),
          url: assets.locationMarkerPath
        }
      }),
      point: point
    });
  });
};
