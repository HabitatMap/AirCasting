import { FixedSessionsMapCtrl } from "./_fixed_sessions_map_ctrl";

angular
  .module("aircasting")
  .controller("FixedSessionsMapCtrl", [
    "$scope",
    "params",
    "map",
    "sensors",
    "fixedSessions",
    "versioner",
    "$window",
    FixedSessionsMapCtrl
  ]);
