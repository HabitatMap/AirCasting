export const lengthToPixels = (length, zoom) => {
  const pixelSize = Math.pow(2, -zoom);
  return length / pixelSize;
};

export const pixelsToLength = (pixels, zoom) => pixels * Math.pow(2, -zoom);
