export const setupZoomSlider = () => {
  window.__elmApp.ports.setZoom.subscribe(level => {
    console.warn("settin zoom", level);
    window.__map.setZoom(level);
  });
};
