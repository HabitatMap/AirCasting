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
  const nw = new google.maps.LatLng(
    map.getBounds()!.getNorthEast().lat(),
    map.getBounds()!.getSouthWest().lng()
  );
  const worldCoordinateNW = projection.fromLatLngToPoint(nw);
  const worldCoordinate = projection.fromLatLngToPoint(latLng);
  if (!worldCoordinate || !worldCoordinateNW) {
    throw new Error("World coordinate is null");
  }

  const pixelOffset = new google.maps.Point(
    Math.floor((worldCoordinate.x - worldCoordinateNW.x) * scale),
    Math.floor((worldCoordinate.y - worldCoordinateNW.y) * scale)
  );

  return pixelOffset;
};

export { getClusterPixelPosition };
