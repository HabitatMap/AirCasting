const SELECTED_SESSION_DIV_HEIGHT = 220;

const googleMaps = () => {
  let onPanOrZoomHandle;
  let onPanOrZoomCallback = () => {};

  const unlistenPanOrZoom = (mapObj) =>
    google.maps.event.clearListeners(mapObj, "bounds_changed");

  return {
    init: (element, options) =>
      (window.__map = new google.maps.Map(element, options)),

    fitBounds: (mapObj, viewport) => mapObj.fitBounds(viewport, 0),

    fitBoundsWithBottomPadding: (mapObj, viewport) =>
      mapObj.fitBounds(viewport, {
        bottom: SELECTED_SESSION_DIV_HEIGHT,
        top: 0,
        left: 0,
        right: 0,
      }),

    unlistenPanOrZoom,

    relistenPanOrZoom: (mapObj) => {
      unlistenPanOrZoom(mapObj);
      onPanOrZoomHandle = mapObj.addListener(
        "bounds_changed",
        onPanOrZoomCallback
      );
    },

    listenPanOrZoom: (mapObj, callback) => {
      unlistenPanOrZoom(mapObj);
      onPanOrZoomCallback = callback;
      onPanOrZoomHandle = mapObj.addListener("bounds_changed", callback);
    },

    addListener: (obj, name, callback) =>
      google.maps.event.addListener(obj, name, callback),

    addListenerOnce: (obj, name, callback) =>
      google.maps.event.addListenerOnce(obj, name, callback),

    latLng: (lat, lng) => new google.maps.LatLng(lat, lng),

    latLngBounds: (lat, lng) => new google.maps.LatLngBounds(lat, lng),

    fromLatLngToPoint: (mapObj, latLng) =>
      mapObj.getProjection().fromLatLngToPoint(latLng),
  };
};

export default googleMaps();
