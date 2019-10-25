export const setupZoomSlider = () => {
  window.__elmApp.ports.zoomChanged.send(window.__map.getZoom());

  window.__elmApp.ports.setZoom.subscribe(level => {
    window.__map.setZoom(level);
  });

  google.maps.event.addListener(window.__map, "zoom_changed", () => {
    window.__elmApp.ports.zoomChanged.send(window.__map.getZoom());
  });
};
