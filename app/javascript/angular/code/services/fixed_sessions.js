import { fixedSessions } from "./_fixed_sessions";

angular
  .module("aircasting")
  .factory("fixedSessions", [
    "map",
    "$rootScope",
    "sessionsDownloader",
    "$window",
    fixedSessions
  ]);
