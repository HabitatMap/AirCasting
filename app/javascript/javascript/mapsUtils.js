export const lengthToPixels = (length, zoom) => {
  const pixelSize = Math.pow(2, -zoom);
  return length / pixelSize;
};

export const pixelsToLength = (pixels, zoom) => pixels * Math.pow(2, -zoom);

export const clearMap = () => {
  if (process.env.NODE_ENV === "test") return;
  window.__map.clearMarkers();
  window.__map.clearInfoWindows();
  window.__map.clearPolygons();
};

if (process.env.NODE_ENV !== "test") {
  // Polygons
  google.maps.Map.prototype.polylines = new Array();
  google.maps.Map.prototype.rectangles = new Array();

  google.maps.Map.prototype.clearPolygons = function() {
    this.polylines.forEach(polyline => polyline.setMap(null));
    this.polylines = new Array();
    this.rectangles.forEach(rectangle => rectangle.setMap(null));
    this.rectangles = new Array();
  };

  // InfoWindows
  google.maps.Map.prototype.infoWindows = new Array();

  google.maps.Map.prototype.clearInfoWindows = function() {
    this.infoWindows.forEach(infoWindow => infoWindow.close());
    this.infoWindows = new Array();
  };

  google.maps.InfoWindow.prototype._open =
    google.maps.InfoWindow.prototype.open;

  google.maps.InfoWindow.prototype.open = function(map, marker) {
    if (map) {
      map.infoWindows.push(this);
    }
    this._open(map, marker);
  };

  // Markers
  google.maps.Map.prototype.markers = new Array();

  google.maps.Map.prototype.clearMarkers = function() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = new Array();
  };

  google.maps.Marker.prototype._setMap = google.maps.Marker.prototype.setMap;

  google.maps.Marker.prototype.setMap = function(map) {
    if (map) {
      map.markers.push(this);
    }
    this._setMap(map);
  };
}
