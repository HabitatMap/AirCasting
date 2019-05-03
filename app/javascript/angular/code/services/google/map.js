import { map } from "./_map.js.erb";

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
    "$window",
    map
  ]);
