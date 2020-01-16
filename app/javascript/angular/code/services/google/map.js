import { map } from "./_map.js";

angular
  .module("google")
  .factory("map", [
    "params",
    "$rootScope",
    "digester",
    "googleMaps",
    "$window",
    map
  ]);
