import { InfoWindowCtrl } from "./_info_window_ctrl";

angular
  .module("aircasting")
  .controller("InfoWindowCtrl", [
    "$scope",
    "infoWindow",
    "map",
    InfoWindowCtrl
  ]);
