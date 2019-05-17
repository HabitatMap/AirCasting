import { SessionsListCtrl } from "./_sessions_list_ctrl";

angular
  .module("aircasting")
  .controller("SessionsListCtrl", [
    "$scope",
    "params",
    "sensors",
    "flash",
    "$window",
    "drawSession",
    "markerSelected",
    "updateCrowdMapLayer",
    "sessionsUtils",
    "map",
    SessionsListCtrl
  ]);
