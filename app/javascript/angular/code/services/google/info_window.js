import constants from "../../../../javascript/constants";

angular.module("google").factory("infoWindow", [
  "map",
  "$http",
  "$compile",
  "$rootScope",
  "versioner",
  "$timeout",
  function(map, $http, $compile, $rootScope, versioner, $timeout) {
    var InfoWindow = function() {
      this.popup = new google.maps.InfoWindow();
      map.addListener("zoom_changed", _(this.hide).bind(this));
    };
    let prevMapPosition = {};

    const FIXED_INFO_WINDOW_PATH = "/partials/fixed_info_window.html";
    const MOBILE_INFO_WINDOW_PATH = "/partials/info_window.html";

    InfoWindow.prototype = {
      get: function() {
        return this.popup;
      },

      show: function(url, data, position, sessionType) {
        debugger;
        if (first_popup(this.popup)) {
          prevMapPosition = {
            bounds: map.getBounds(),
            zoom: window.__map.getZoom()
          };
        }

        this.popup.setContent("fetching...");
        this.popup.setPosition(position);
        map.setHasChangedProgrammatically(true);
        this.popup.open(map.get());
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
        var url = versioner.path(htmlPath);
        var element = $(
          '<div class="info-window"><div ng-include="\'' +
            url +
            "'\"></div></div>"
        );
        $compile(element[0])($rootScope);
        this.popup.setContent(element[0]);
        map.setHasChangedProgrammatically(true);
        this.popup.open(map.get());
        google.maps.event.addListener(this.popup, "closeclick", function() {
          map.fitBounds(prevMapPosition.bounds, prevMapPosition.zoom);
        });
      },

      hide: function() {
        this.popup.close();
      }
    };

    return new InfoWindow();
  }
]);

const first_popup = popup => popup.content === undefined;
