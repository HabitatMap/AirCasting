import { mobileSessions } from "./_mobile_sessions";

angular
  .module("aircasting")
  .factory("mobileSessions", [
    "$rootScope",
    "sessionsDownloader",
    "$window",
    "updateCrowdMapLayer",
    mobileSessions
  ]);
