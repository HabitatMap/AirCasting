import { FixedSessionsMapCtrl } from "./_fixed_sessions_map_ctrl";

angular
  .module("aircasting")
  .controller("FixedSessionsMapCtrl", [
    "$scope",
    "params",
    "heat",
    "map",
    "sensors",
    "fixedSessions",
    "versioner",
    "$window",
    "infoWindow",
    "$http",
    FixedSessionsMapCtrl
  ]);
