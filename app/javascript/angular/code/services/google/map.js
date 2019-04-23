import { map } from "./_map";

angular
  .module("google")
  .factory("map", [
    "params",
    "$cookieStore",
    "$rootScope",
    "digester",
    "rectangles",
    "geocoder",
    "googleMaps",
    "heat",
    map
  ]);
