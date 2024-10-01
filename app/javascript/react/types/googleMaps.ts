type MapOptions = google.maps.MapOptions;
type Map = google.maps.Map;
type LatLngLiteral = google.maps.LatLngLiteral;

export { LatLngLiteral, Map, type MapOptions };

export interface CustomMarker extends google.maps.Marker {
  get(key: string): any;
  set(key: string, value: any): void;
}
