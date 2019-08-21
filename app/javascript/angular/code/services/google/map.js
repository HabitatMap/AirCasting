import { map } from "./_map.js";

angular
  .module("google")
  .factory("map", [
    "params",
    "$cookieStore",
    "$rootScope",
    "digester",
    "rectangles",
    "googleMaps",
    "heat",
    "$window",
    map
  ]);
