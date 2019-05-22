import { MobileSessionsMapCtrl } from "./_mobile_sessions_map_ctrl";

angular
  .module("aircasting")
  .controller("MobileSessionsMapCtrl", [
    "$scope",
    "params",
    "map",
    "sensors",
    "mobileSessions",
    "versioner",
    "functionBlocker",
    "$window",
    "infoWindow",
    "sessionsUtils",
    MobileSessionsMapCtrl
  ]);
