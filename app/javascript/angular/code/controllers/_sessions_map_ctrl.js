import * as FiltersUtils from "../../../javascript/filtersUtils";
import { clearMap } from "../../../javascript/clearMap";
import { applyTheme } from "../../../javascript/theme";
import { getParams } from "../../../javascript/params";

export const SessionsMapCtrl = (
  $scope,
  params,
  map,
  sensors,
  sessions,
  versioner,
  $window,
  sessionsUtils
) => {
  sensors.setSensors($window.__sensors);

  $scope.setDefaults = function() {
    $scope.versioner = versioner;
    $scope.params = params;
    $scope.sensors = sensors;
    $scope.sessions = sessions;
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

    const defs = sessions.isMobile()
      ? { ...defaults, gridResolution: 31, crowdMap: false }
      : { ...defaults, isIndoor: false, isActive: true };

    params.updateFromDefaults(defs);
  };

  $scope.setDefaults();

  if (process.env.NODE_ENV !== "test") {
    angular.element(document).ready(function() {
      const elmApp = window.__elmApp;

      elmApp.ports.selectSensorId.subscribe(sensorId => {
        sessions.deselectSession();
        params.update({ data: { sensorId } });
        sessions.fetch();
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
        const obj = {
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

        return sessions.isMobile()
          ? obj
          : { ...obj, is_indoor: data.isIndoor, is_active: data.isActive };
      };

      FiltersUtils.setupTagsAutocomplete(
        selectedValue => elmApp.ports.tagSelected.send(selectedValue),
        sessions.isMobile()
          ? "api/mobile/autocomplete/tags"
          : "api/fixed/autocomplete/tags",
        createTagsFilterParams
      );

      elmApp.ports.updateTags.subscribe(tags => {
        params.update({ data: { tags: tags.join(", ") } });
        sessions.fetch();
      });

      elmApp.ports.updateProfiles.subscribe(profiles => {
        params.update({ data: { usernames: profiles.join(", ") } });
        sessions.fetch();
      });

      const onTimeRangeChanged = (timeFrom, timeTo) => {
        elmApp.ports.timeRangeSelected.send({ timeFrom, timeTo });
        FiltersUtils.setTimerangeButtonText(timeFrom, timeTo);
        params.update({ data: { timeFrom, timeTo } });
        sessions.fetch();
      };

      FiltersUtils.setupClipboard();

      elmApp.ports.showCopyLinkTooltip.subscribe(tooltipId => {
        const currentUrl = encodeURIComponent(window.location.href);

        FiltersUtils.fetchShortUrl(tooltipId, currentUrl);
      });

      elmApp.ports.toggleTheme.subscribe(theme => {
        const cb = sessions.isMobile()
          ? () => {
              if (params.selectedSessionIds().length !== 0) {
                sessions.redrawSelectedSession();
              }
            }
          : () => {};
        params.update({ theme: theme });
        $scope.$apply();
        applyTheme(cb);
      });

      // fixed tab
      const setupActiveTimeRangeFilter = (timeFrom, timeTo) => {
        if (
          document.getElementById("time-range") &&
          document.getElementById("time-range-button")
        ) {
          $("#time-range").daterangepicker(
            FiltersUtils.daterangepickerConfig(timeFrom, timeTo)
          );

          $("#time-range-button").daterangepicker(
            FiltersUtils.daterangepickerConfig(timeFrom, timeTo),
            FiltersUtils.setTimerangeButtonText(timeFrom, timeTo)
          );
        } else {
          window.setTimeout(setupActiveTimeRangeFilter(timeFrom, timeTo), 100);
        }
      };

      if (params.get("data").isActive) {
        // fixed tab
        setupActiveTimeRangeFilter(
          FiltersUtils.oneHourAgo(),
          FiltersUtils.presentMoment()
        );
      } else {
        // fixed or mobile tab
        FiltersUtils.setupTimeRangeFilter(
          onTimeRangeChanged,
          params.get("data").timeFrom,
          params.get("data").timeTo,
          elmApp.ports.isShowingTimeRangeFilter.send
        );
      }

      // fixed or mobile tab
      const resetTimeRangeFilter = () => {
        if (params.get("data").isActive) {
          // fixed tab
          setupActiveTimeRangeFilter(
            FiltersUtils.oneHourAgo(),
            FiltersUtils.presentMoment()
          );
          sessions.fetch();
        } else {
          // fixed or mobile tab
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

      elmApp.ports.refreshTimeRange.subscribe(() => {
        resetTimeRangeFilter();
      });

      // mobile tab
      elmApp.ports.toggleCrowdMap.subscribe(crowdMap => {
        params.updateData({ crowdMap });
        $scope.$apply();

        sessions.toggleCrowdMapView();
      });

      // mobile tab
      elmApp.ports.updateResolution.subscribe(gridResolution => {
        params.updateData({ gridResolution });
        sessionsUtils.updateCrowdMapLayer(sessions.allSessionIds());
      });

      // fixed tab
      elmApp.ports.toggleIndoor.subscribe(isIndoor => {
        params.update({ data: { isIndoor: isIndoor } });
        sessions.fetch();
      });

      // fixed tab
      elmApp.ports.toggleActive.subscribe(isActive => {
        params.update({ data: { isActive } });
        resetTimeRangeFilter();
        sessions.fetch();
      });
    });
  }
};
