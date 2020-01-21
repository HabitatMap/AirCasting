import { fixedSessions } from "./_fixed_sessions";

angular
  .module("aircasting")
  .factory("fixedSessions", ["$rootScope", "$window", fixedSessions]);
