import _ from "underscore";
import moment from "moment";
import * as FiltersUtils from "../../../javascript/filtersUtils";
import { clearMap } from "../../../javascript/mapsUtils";
import { applyTheme } from "../../../javascript/theme";
import { DEFAULT_THEME } from "../../../javascript/constants";
import { getParams } from "../../../javascript/params";

const endOfToday = moment()
  .utc()
  .endOf("day")
  .format("X");
const oneYearAgo = moment()
  .utc()
  .startOf("day")
  .subtract(1, "year")
  .format("X");

export const MobileSessionsMapCtrl = (
  $scope,
  params,
  map,
  sensors,
  mobileSessions,
  versioner,
  $window,
  infoWindow,
  sessionsUtils
) => {
  sensors.setSensors($window.__sensors);

  $scope.setDefaults = function() {
    $scope.versioner = versioner;
    $scope.params = params;
    $scope.sensors = sensors;
    $scope.sessions = mobileSessions;
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
      tags: "",
      usernames: "",
      gridResolution: 31,
      crowdMap: false,
      timeFrom: oneYearAgo,
      timeTo: endOfToday,
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
      if (newValue === oldValue) return;

      if ($scope.params.isCrowdMapOn() && !sessionsUtils.isSessionSelected()) {
        sessionsUtils.updateCrowdMapLayer(mobileSessions.sessionIds());
      } else if (sessionsUtils.isSessionSelected()) {
        mobileSessions.redrawSelectedSession();
      } else {
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

      elmApp.ports.toggleCrowdMap.subscribe(crowdMap => {
        params.updateData({ crowdMap });
        $scope.$apply();

        $scope.sessions.toggleCrowdMapView();
      });

      elmApp.ports.updateResolution.subscribe(gridResolution => {
        params.updateData({ gridResolution });
        sessionsUtils.updateCrowdMapLayer($scope.sessions.allSessionIds());
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
          unit_symbol: sensors.selected().unit_symbol
        };
      };

      FiltersUtils.setupTagsAutocomplete(
        selectedValue => elmApp.ports.tagSelected.send(selectedValue),
        "api/mobile/autocomplete/tags",
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

      FiltersUtils.setupTimeRangeFilter(
        onTimeRangeChanged,
        params.get("data").timeFrom,
        params.get("data").timeTo,
        elmApp.ports.isShowingTimeRangeFilter.send
      );

      elmApp.ports.refreshTimeRange.subscribe(() => {
        FiltersUtils.setupTimeRangeFilter(
          onTimeRangeChanged,
          oneYearAgo,
          endOfToday,
          elmApp.ports.isShowingTimeRangeFilter.send
        );

        onTimeRangeChanged(oneYearAgo, endOfToday);
      });

      FiltersUtils.setupClipboard();

      elmApp.ports.showCopyLinkTooltip.subscribe(tooltipId => {
        const currentUrl = encodeURIComponent(window.location.href);

        FiltersUtils.fetchShortUrl(tooltipId, currentUrl);
      });

      elmApp.ports.toggleTheme.subscribe(theme => {
        params.update({ theme: theme });
        $scope.$apply();
        applyTheme(() => {
          if (params.selectedSessionIds().length !== 0) {
            sessions.redrawSelectedSession();
          }
        });
      });
    });
  }
};
