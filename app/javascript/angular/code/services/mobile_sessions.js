import { mobileSessions } from "./_mobile_sessions";

angular
  .module("aircasting")
  .factory("mobileSessions", [
    "$rootScope",
    "$window",
    "updateCrowdMapLayer",
    mobileSessions
  ]);
