import _ from "underscore";
import * as FiltersUtils from "../filtersUtils";

export const FixedSessionsMapCtrl = (
  $scope,
  params,
  heat,
  map,
  sensors,
  fixedSessions,
  versioner,
  singleFixedSession,
  functionBlocker,
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
    $scope.singleSession = singleFixedSession;
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
      isIndoor: false,
      isStreaming: true,
      tags: "",
      usernames: "",
      timeFrom: FiltersUtils.oneYearAgo(),
      timeTo: FiltersUtils.endOfToday()
    };

    if (!params.get("data").heat) sensors.fetchHeatLevels();

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
        params.update({ selectedSessionIds: [] });
        params.update({ data: { sensorId } });
        sensors.fetchHeatLevels();
        $scope.sessions.fetch();
      });

      elmApp.ports.findLocation.subscribe(location => {
        FiltersUtils.findLocation(location, params, map);
      });

      elmApp.ports.toggleIndoor.subscribe(isIndoor => {
        params.update({ data: { isIndoor: isIndoor } });
        $scope.sessions.fetch();
      });

      elmApp.ports.toggleStreaming.subscribe(isStreaming => {
        params.update({ data: { isStreaming } });
        resetTimeRangeFilter();
        $scope.sessions.fetch();
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

      const setupStreamingTimeRangeFilter = (timeFrom, timeTo) => {
        if (document.getElementById("time-range")) {
          $("#time-range").daterangepicker({
            linkedCalendars: false,
            timePicker: true,
            timePicker24Hour: true,
            startDate: moment
              .unix(timeFrom)
              .utc()
              .format("MM/DD/YYYY HH:mm"),
            endDate: moment
              .unix(timeTo)
              .utc()
              .format("MM/DD/YYYY HH:mm"),
            locale: {
              format: "MM/DD/YYYY HH:mm"
            }
          });
        } else {
          window.setTimeout(
            setupStreamingTimeRangeFilter(timeFrom, timeTo),
            100
          );
        }
      };

      if (params.get("data").isStreaming) {
        setupStreamingTimeRangeFilter(
          FiltersUtils.oneHourAgo(),
          FiltersUtils.presentMoment()
        );
      } else {
        FiltersUtils.setupTimeRangeFilter(
          onTimeRangeChanged,
          params.get("data").timeFrom,
          params.get("data").timeTo
        );
      }

      elmApp.ports.refreshTimeRange.subscribe(() => {
        resetTimeRangeFilter();
      });

      const resetTimeRangeFilter = () => {
        if (params.get("data").isStreaming) {
          setupStreamingTimeRangeFilter(
            FiltersUtils.oneHourAgo(),
            FiltersUtils.presentMoment()
          );
          $scope.sessions.fetch();
        } else {
          FiltersUtils.setupTimeRangeFilter(
            onTimeRangeChanged,
            FiltersUtils.oneYearAgo(),
            FiltersUtils.endOfToday()
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
    });
  }
};
