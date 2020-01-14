import { fixedSessions } from "./_fixed_sessions";

angular
  .module("aircasting")
  .factory("fixedSessions", [
    "params",
    "map",
    "sensors",
    "$rootScope",
    "sessionsDownloader",
    "$window",
    "heat",
    "infoWindow",
    fixedSessions
  ]);
