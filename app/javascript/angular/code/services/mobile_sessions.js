import { mobileSessions } from "./_mobile_sessions";

angular
  .module("aircasting")
  .factory("mobileSessions", [
    "params",
    "map",
    "sensors",
    "$rootScope",
    "sessionsDownloader",
    "drawSession",
    "heat",
    "$window",
    "updateCrowdMapLayer",
    mobileSessions
  ]);
