import _ from "underscore";
import * as FiltersUtils from "../../../javascript/filtersUtils";
import { clearMap } from "../../../javascript/mapsUtils";
import { applyTheme } from "../../../javascript/theme";
import { DEFAULT_THEME } from "../../../javascript/constants";
import { getParams } from "../../../javascript/params";

export const FixedSessionsMapCtrl = (
  $scope,
  params,
  heat,
  map,
  sensors,
  fixedSessions,
  versioner,
  $window,
  infoWindow,
  $http
) => {
  sensors.setSensors($window.__sensors);

  $scope.setDefaults = function() {
    $scope.versioner = versioner;
    $scope.params = params;
    $scope.sensors = sensors;
    $scope.sessions = fixedSessions;
    $scope.$window = $window;

    clearMap();
    map.unregisterAll();

    if (process.env.NODE_ENV !== "test") {
      $($window).resize(function() {
        $scope.$digest();
      });
    }

    const sensorId = params.get("data", { sensorId: sensors.defaultSensorId })
      .sensorId;

    const defaults = {
      sensorId,
      location: "",
      isIndoor: false,
      isActive: true,
      tags: "",
      usernames: "",
      timeFrom: FiltersUtils.oneYearAgo(),
      timeTo: FiltersUtils.endOfToday(),
      heat: {
        lowest: 0,
        low: 12,
        mid: 35,
        high: 55,
        highest: 150
      }
    };

    params.updateFromDefaults(defaults);
  };

  $scope.$watch(
    "params.get('data').heat",
    function(newValue, oldValue) {
      console.log(
        "watch - params.get('data').heat - ",
        newValue,
        " - ",
        oldValue
      );
      if (newValue != oldValue) {
        $scope.sessions.drawSessionsInLocation();
      }
    },
    true
  );

  $scope.setDefaults();

  if (process.env.NODE_ENV !== "test") {
    angular.element(document).ready(function() {
      const elmApp = window.__elmApp;

      elmApp.ports.selectSensorId.subscribe(sensorId => {
        $scope.sessions.deselectSession();
        params.update({ data: { sensorId } });
        $scope.sessions.fetch();
      });

      elmApp.ports.findLocation.subscribe(location => {
        FiltersUtils.findLocation(location, params, map);
      });

      elmApp.ports.toggleIndoor.subscribe(isIndoor => {
        params.update({ data: { isIndoor: isIndoor } });
        $scope.sessions.fetch();
      });

      elmApp.ports.toggleActive.subscribe(isActive => {
        params.update({ data: { isActive } });
        resetTimeRangeFilter();
        $scope.sessions.fetch();
      });

      map.onPanOrZoom(() => {
        FiltersUtils.clearLocation(elmApp.ports.locationCleared.send, params);
      });

      FiltersUtils.setupProfileNamesAutocomplete(selectedValue =>
        elmApp.ports.profileSelected.send(selectedValue)
      );

      const createTagsFilterParams = () => {
        const bounds = map.getBounds();
        const data = getParams().data;

        return {
          west: bounds.west,
          east: bounds.east,
          south: bounds.south,
          north: bounds.north,
          time_from: data.timeFrom,
          time_to: data.timeTo,
          usernames: data.usernames,
          sensor_name: sensors.selected().sensor_name,
          unit_symbol: sensors.selected().unit_symbol,
          is_indoor: data.isIndoor,
          is_active: data.isActive
        };
      };

      FiltersUtils.setupTagsAutocomplete(
        selectedValue => elmApp.ports.tagSelected.send(selectedValue),
        "api/fixed/autocomplete/tags",
        createTagsFilterParams
      );

      elmApp.ports.updateTags.subscribe(tags => {
        params.update({ data: { tags: tags.join(", ") } });
        $scope.sessions.fetch();
      });

      elmApp.ports.updateProfiles.subscribe(profiles => {
        params.update({ data: { usernames: profiles.join(", ") } });
        $scope.sessions.fetch();
      });

      const onTimeRangeChanged = (timeFrom, timeTo) => {
        elmApp.ports.timeRangeSelected.send({ timeFrom, timeTo });
        params.update({ data: { timeFrom, timeTo } });
        $scope.sessions.fetch();
      };

      const setupActiveTimeRangeFilter = (timeFrom, timeTo) => {
        if (document.getElementById("time-range")) {
          $("#time-range").daterangepicker(
            FiltersUtils.daterangepickerConfig(timeFrom, timeTo)
          );
        } else {
          window.setTimeout(setupActiveTimeRangeFilter(timeFrom, timeTo), 100);
        }
      };

      if (params.get("data").isActive) {
        setupActiveTimeRangeFilter(
          FiltersUtils.oneHourAgo(),
          FiltersUtils.presentMoment()
        );
      } else {
        FiltersUtils.setupTimeRangeFilter(
          onTimeRangeChanged,
          params.get("data").timeFrom,
          params.get("data").timeTo,
          elmApp.ports.isShowingTimeRangeFilter.send
        );
      }

      elmApp.ports.refreshTimeRange.subscribe(() => {
        resetTimeRangeFilter();
      });

      const resetTimeRangeFilter = () => {
        if (params.get("data").isActive) {
          setupActiveTimeRangeFilter(
            FiltersUtils.oneHourAgo(),
            FiltersUtils.presentMoment()
          );
          $scope.sessions.fetch();
        } else {
          FiltersUtils.setupTimeRangeFilter(
            onTimeRangeChanged,
            FiltersUtils.oneYearAgo(),
            FiltersUtils.endOfToday(),
            elmApp.ports.isShowingTimeRangeFilter.send
          );

          onTimeRangeChanged(
            FiltersUtils.oneYearAgo(),
            FiltersUtils.endOfToday()
          );
        }
      };

      FiltersUtils.setupClipboard();

      elmApp.ports.showCopyLinkTooltip.subscribe(tooltipId => {
        const currentUrl = encodeURIComponent(window.location.href);

        FiltersUtils.fetchShortUrl(tooltipId, currentUrl);
      });

      elmApp.ports.toggleTheme.subscribe(theme => {
        params.update({ theme: theme });
        $scope.$apply();
        applyTheme(() => {});
      });
    });
  }
};
