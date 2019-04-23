import { drawSession } from "./_draw_session";

angular
  .module("aircasting")
  .factory("drawSession", [
    "sensors",
    "map",
    "heat",
    "note",
    "empty",
    drawSession
  ]);
