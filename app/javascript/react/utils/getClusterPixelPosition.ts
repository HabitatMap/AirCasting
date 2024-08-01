const getClusterPixelPosition = (
  map: google.maps.Map,
  latLng: google.maps.LatLng
) => {
  const zoom = map.getZoom();
  if (!zoom) {
    throw new Error("Map zoom level is undefined");
  }

  const projection = map.getProjection();
  if (!projection) {
    throw new Error("Map projection is undefined");
  }

  const scale = Math.pow(2, zoom);
  const bounds = map.getBounds();
  if (!bounds) {
    throw new Error("Map bounds are undefined");
  }

  const nw = new google.maps.LatLng(
    bounds.getNorthEast().lat(),
    bounds.getSouthWest().lng()
  );
  const worldCoordinateNW = projection.fromLatLngToPoint(nw);
  const worldCoordinate = projection.fromLatLngToPoint(latLng);
  if (!worldCoordinate || !worldCoordinateNW) {
    throw new Error("World coordinate is null");
  }

  let xOffset = (worldCoordinate.x - worldCoordinateNW.x) * scale;
  const yOffset = (worldCoordinate.y - worldCoordinateNW.y) * scale;

  const totalWorldPixels = 256 * scale;

  if (xOffset < -totalWorldPixels / 2) {
    xOffset += totalWorldPixels;
  } else if (xOffset > totalWorldPixels / 2) {
    xOffset -= totalWorldPixels;
  }

  xOffset = (xOffset + totalWorldPixels) % totalWorldPixels;

  const pixelOffset = new google.maps.Point(
    Math.floor(xOffset),
    Math.floor(yOffset)
  );

  return pixelOffset;
};

export { getClusterPixelPosition };
