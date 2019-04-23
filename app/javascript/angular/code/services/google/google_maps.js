angular.module("google").factory("googleMaps", [
  () => {
    let onPanOrZoomHandle;
    let onPanOrZoomCallback = () => {};

    const unlistenPanOrZoom = mapObj =>
      google.maps.event.clearListeners(mapObj, "bounds_changed");

    return {
      init: (element, options) => new google.maps.Map(element, options),

      wasGeocodingSuccessful: status =>
        status === google.maps.GeocoderStatus.OK,

      fitBounds: (mapObj, viewport) => mapObj.fitBounds(viewport),

      unlistenPanOrZoom,

      relistenPanOrZoom: mapObj => {
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

      listen: (obj, name, callback) =>
        google.maps.event.addListener(obj, name, callback),

      latLng: (lat, lng) => new google.maps.LatLng(lat, lng),

      latLngBounds: (lat, lng) => new google.maps.LatLngBounds(lat, lng),

      fromLatLngToPoint: (mapObj, latLng) =>
        mapObj.getProjection().fromLatLngToPoint(latLng)
    };
  }
]);
