const getRectanglePixelPosition = (
  map: google.maps.Map,
  rectangle: google.maps.Rectangle
): { top: number; left: number } => {
  const bounds = rectangle.getBounds();
  if (!bounds) {
    throw new Error("Map bounds are undefined");
  }

  const projection = map.getProjection();
  if (!projection) {
    throw new Error("Map projection is undefined");
  }

  const ne = bounds.getNorthEast(); // Northeast corner of the rectangle
  const sw = bounds.getSouthWest(); // Southwest corner of the rectangle

  // Convert LatLng to Point (pixel position)
  const nePoint = projection.fromLatLngToPoint(ne);
  const swPoint = projection.fromLatLngToPoint(sw);

  // Convert Point to pixel position on the map's container
  const scale = Math.pow(2, map.getZoom()!); // The scale based on the current zoom level
  const mapDiv = map.getDiv();

  const nePixel = new google.maps.Point(
    Math.floor(nePoint?.x * scale),
    Math.floor(nePoint.y * scale)
  );
  const swPixel = new google.maps.Point(
    Math.floor(swPoint.x * scale),
    Math.floor(swPoint.y * scale)
  );

  // Calculate the top and left position based on the northeast and southwest points
  const top = nePixel.y;
  const left = swPixel.x;

  return { top, left };
};

export { getRectanglePixelPosition };
