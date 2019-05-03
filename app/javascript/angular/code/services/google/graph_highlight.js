import { removeMarker, drawMarker } from "./_map";

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
        icon: "/assets/location_marker.svg"
      }),
      point: point
    });
  });
};
