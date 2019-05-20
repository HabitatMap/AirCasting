import _ from "underscore";
import moment from "moment";
import * as FiltersUtils from "../filtersUtils";

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
  singleMobileSession,
  functionBlocker,
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
    $scope.singleSession = singleMobileSession;
    $scope.$window = $window;

    functionBlocker.block(
      "sessionHeat",
      !_(params.get("selectedSessionIds")).isEmpty()
    );

    map.clearRectangles();
    infoWindow.hide();
    map.unregisterAll();
    map.removeAllMarkers();

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
      gridResolution: 25,
      crowdMap: false,
      timeFrom: oneYearAgo,
      timeTo: endOfToday
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
        mobileSessions.redrawSelectedSession(
          $scope.params.selectedSessionIds()[0]
        );
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
        params.update({ selectedSessionIds: [] });
        params.update({ data: { sensorId } });
        $scope.sessions.fetch();
      });

      elmApp.ports.toggleCrowdMap.subscribe(crowdMap => {
        params.updateData({ crowdMap });
        $scope.sessions.fetch();
      });

      elmApp.ports.updateResolution.subscribe(gridResolution => {
        params.updateData({ gridResolution });
        sessionsUtils.updateCrowdMapLayer($scope.sessions.allSessionIds());
      });

      elmApp.ports.findLocation.subscribe(location => {
        FiltersUtils.findLocation(location, params, map);
      });

      map.onPanOrZoom(() => {
        FiltersUtils.clearLocation(elmApp.ports.locationCleared, params);
      });

      FiltersUtils.setupAutocomplete(
        selectedValue => elmApp.ports.profileSelected.send(selectedValue),
        "profile-names",
        "/autocomplete/usernames"
      );

      FiltersUtils.setupAutocomplete(
        selectedValue => elmApp.ports.tagSelected.send(selectedValue),
        "tags",
        "/autocomplete/tags"
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
        params.get("data").timeTo
      );

      elmApp.ports.refreshTimeRange.subscribe(() => {
        FiltersUtils.setupTimeRangeFilter(
          onTimeRangeChanged,
          oneYearAgo,
          endOfToday
        );

        onTimeRangeChanged(oneYearAgo, endOfToday);
      });

      FiltersUtils.setupClipboard();

      elmApp.ports.showCopyLinkTooltip.subscribe(tooltipId => {
        const currentUrl = encodeURIComponent(window.location.href);

        FiltersUtils.fetchShortUrl(tooltipId, currentUrl);
      });
    });
  }
};
