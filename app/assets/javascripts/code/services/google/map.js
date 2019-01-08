import { map } from './_map';

angular.module("google").factory("map", [
  "params",
  "$rootScope",
  "digester",
  "rectangles",
  "geocoder",
  "googleMaps",
  map
]);
