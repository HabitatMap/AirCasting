import { SessionsMapCtrl } from "./_sessions_map_ctrl";
import constants from "../../../javascript/constants";

const sessions =
  window.location.pathname === constants.mobileMapRoute
    ? "mobileSessions"
    : "fixedSessions";

angular
  .module("aircasting")
  .controller("SessionsMapCtrl", [
    "$scope",
    sessions,
    "$window",
    "updateCrowdMapLayer",
    SessionsMapCtrl
  ]);
