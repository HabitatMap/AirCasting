import { fixedSessions } from "./_fixed_sessions";

angular
  .module("aircasting")
  .factory("fixedSessions", [
    "params",
    "map",
    "$rootScope",
    "sessionsDownloader",
    "$window",
    fixedSessions
  ]);
