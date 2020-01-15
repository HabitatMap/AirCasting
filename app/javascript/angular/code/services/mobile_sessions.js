import { mobileSessions } from "./_mobile_sessions";

angular
  .module("aircasting")
  .factory("mobileSessions", [
    "params",
    "map",
    "$rootScope",
    "sessionsDownloader",
    "drawSession",
    "$window",
    "updateCrowdMapLayer",
    mobileSessions
  ]);
