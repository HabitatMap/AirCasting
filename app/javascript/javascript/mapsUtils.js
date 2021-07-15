let prevMapPosition = {};
let hasChangedProgrammatically = false;

export const setHasChangedProgrammatically = (value) => {
  hasChangedProgrammatically = value;
};

export const getHasChangedProgrammatically = () => hasChangedProgrammatically;

export const lengthToPixels = (length, zoom) => {
  const pixelSize = Math.pow(2, -zoom);
  return length / pixelSize;
};

export const pixelsToLength = (pixels, zoom) => pixels * Math.pow(2, -zoom);

export const savePosition = () => {
  prevMapPosition = {
    bounds: getBounds(),
    zoom: window.__map.getZoom(),
  };
};

export const getSavedPosition = () => prevMapPosition;

export const mapObj = () => window.__map;

const getBounds = () => {
  var bounds = window.__map.getBounds();
  if (bounds) {
    return {
      west: bounds.getSouthWest().lng(),
      east: bounds.getNorthEast().lng(),
      south: bounds.getSouthWest().lat(),
      north: bounds.getNorthEast().lat(),
    };
  } else {
    return {};
  }
};

export const onMapInit = () => {
  google.maps.event.addListenerOnce(mapObj(), "idle", function () {
    window.__elmApp.ports.zoomChanged.send(window.__map.getZoom());

    window.__elmApp.ports.setZoom.subscribe((level) => {
      window.__map.setZoom(level);
    });

    google.maps.event.addListener(window.__map, "zoom_changed", () => {
      window.__elmApp.ports.zoomChanged.send(window.__map.getZoom());
    });
  });
};
