const getClusterPixelPosition = (
  map: google.maps.Map,
  latLng: google.maps.LatLng
) => {
  const overlay = new google.maps.OverlayView();
  overlay.setMap(map);
  const overlayProjection = overlay.getProjection();

  if (!overlayProjection) {
    throw new Error("Map projection is undefined");
  }

  const point = overlayProjection.fromLatLngToContainerPixel(latLng);
  if (!point) {
    throw new Error("Could not convert coordinates to point");
  }

  return point;
};

export { getClusterPixelPosition };
