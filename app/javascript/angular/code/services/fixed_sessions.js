import { fixedSessions } from "./_fixed_sessions";

angular
  .module("aircasting")
  .factory("fixedSessions", [
    "params",
    "$http",
    "map",
    "sensors",
    "$rootScope",
    "sessionsDownloader",
    "drawSession",
    "sessionsUtils",
    "$window",
    "heat",
    "infoWindow",
    fixedSessions
  ]);
