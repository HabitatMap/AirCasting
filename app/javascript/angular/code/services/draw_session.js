import { drawSession } from "./_draw_session.js.erb";

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
