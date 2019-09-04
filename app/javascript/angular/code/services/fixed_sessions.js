import { fixedSessions } from "./_fixed_sessions";

angular
  .module("aircasting")
  .factory("fixedSessions", [
    "params",
    "map",
    "sensors",
    "$rootScope",
    "sessionsDownloader",
    "sessionsUtils",
    "$window",
    "heat",
    "infoWindow",
    fixedSessions
  ]);
