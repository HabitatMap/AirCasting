let prevMapPosition = {};
let hasChangedProgrammatically = false;

export const setHasChangedProgrammatically = value => {
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
    zoom: window.__map.getZoom()
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
      north: bounds.getNorthEast().lat()
    };
  } else {
    return {};
  }
};
