import { SessionsListCtrl } from "./_sessions_list_ctrl";

angular
  .module("aircasting")
  .controller("SessionsListCtrl", [
    "$scope",
    "params",
    "$window",
    "sessionsUtils",
    "map",
    SessionsListCtrl
  ]);
