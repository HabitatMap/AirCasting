import constants from "../../../../javascript/constants";
import {
  savePosition,
  mapObj,
  getSavedPosition,
  setHasChangedProgrammatically
} from "../../../../javascript/mapsUtils";

let first = true;

angular.module("google").factory("infoWindow", [
  "map",
  "$http",
  "$compile",
  "$rootScope",
  "$timeout",
  function(map, $http, $compile, $rootScope, $timeout) {
    var InfoWindow = function() {
      this.popup = new google.maps.InfoWindow();
      map.addListener("zoom_changed", _(this.hide).bind(this));
    };

    const FIXED_INFO_WINDOW_PATH = "/partials/fixed_info_window.html";
    const MOBILE_INFO_WINDOW_PATH = "/partials/info_window.html";

    InfoWindow.prototype = {
      get: function() {
        return this.popup;
      },

      show: function(url, data, position, sessionType) {
        if (first) savePosition();
        first = false;

        this.popup.setContent("fetching...");
        this.popup.setPosition(position);
        this.popup.setOptions({ disableAutoPan: true });
        this.popup.open(mapObj());

        const htmlPath =
          sessionType === constants.fixedSession
            ? FIXED_INFO_WINDOW_PATH
            : MOBILE_INFO_WINDOW_PATH;

        $timeout(() => {
          $http
            .get(url, { params: data, cache: true })
            .success(data => this.onShowData(data, htmlPath));
        }, 1);
      },

      onShowData: function(data, htmlPath) {
        this.data = data;
        var element = $(
          '<div class="info-window"><div ng-include="\'' +
            htmlPath +
            "'\"></div></div>"
        );
        $compile(element[0])($rootScope);

        this.popup.setContent(element[0]);
        setHasChangedProgrammatically(true);

        this.popup.setOptions({ disableAutoPan: false });
        this.popup.open(mapObj());

        google.maps.event.addListener(this.popup, "closeclick", function() {
          map.fitBounds(getSavedPosition().bounds, getSavedPosition().zoom);
          first = true;
        });
      },

      hide: function() {
        this.popup.close();
        first = true;
      }
    };

    return new InfoWindow();
  }
]);
