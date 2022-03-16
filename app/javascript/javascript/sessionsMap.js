import * as FiltersUtils from "./filtersUtils";
import { clearMap } from "./clearMap";
import { applyTheme } from "./theme";
import { getParams } from "./params";
import sensors from "./sensors";
import pubsub from "./pubsub";
import params from "./params2";
import map from "./map";
import updateCrowdMapLayer from "./updateCrowdMapLayer";
import constants from "./constants";
const sessions =
  window.location.pathname === constants.mobileMapRoute
    ? require("./mobileSessions").default
    : require("./fixedSessions").default;

export default (() => {
  let pulsatingSessionMarker = null;
  const elmApp = window.__elmApp;
  sensors.setSensors(window.__sensors);

  function setDefaults() {
    clearMap();
    map.unregisterAll();

    const sensorId = params.get("data", {
      sensorId: sensors.defaultSensorId(),
    }).sensorId;

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
        highest: 150,
      },
    };

    const defs = sessions.isMobile()
      ? { ...defaults, gridResolution: 31, crowdMap: false }
      : { ...defaults, isIndoor: false, isActive: true };

    params.updateFromDefaults(defs);
  }

  setDefaults();

  pubsub.subscribe("googleMapsChanged", function (newValue) {
    if (params.isSessionSelected()) return;
    // when loading the page for the first time sometimes the watch is triggered twice, first time with hasChangedProgrammatically as undefined
    if (newValue.hasChangedProgrammatically === undefined) return;

    // triggered when deselecting a session or panning to info window
    if (newValue.hasChangedProgrammatically) return;

    if (!params.get("data").isSearchAsIMoveOn) {
      if (sessions.type === "MobileSessions") {
        sessions.onSessionsFetchWithCrowdMapLayerUpdate();
      } else if (sessions.type === "FixedSessions") {
      } else {
        console.warn("Incorrect sessions type");
      }
      if (!newValue.hasChangedProgrammatically) {
        elmApp.ports.mapMoved.send(null);
      }
      return;
    }

    sessions.fetch();
  });

  pubsub.subscribe("googleMapsReady", function () {
    if (params.isSessionSelected()) return;
    sessions.fetch({
      amount: params.paramsData["fetchedSessionsCount"],
    });
  });

  pubsub.subscribe("markerSelected", function (data) {
    if (params.selectedStreamId() === data.streamId) {
      elmApp.ports.toggleSessionSelection.send(null);
    } else {
      elmApp.ports.toggleSessionSelection.send(data.streamId);
    }
  });

  elmApp.ports.selectSession.subscribe((session) => {
    sessions.selectSession(session);
  });

  elmApp.ports.deselectSession.subscribe(() => {
    sessions.deselectSession();
  });

  elmApp.ports.loadMoreSessions.subscribe(() => {
    sessions.fetch({
      fetchedSessionsCount: sessions.sessions.length,
    });
  });

  elmApp.ports.updateHeatMapThresholds.subscribe(
    ({ threshold1, threshold2, threshold3, threshold4, threshold5 }) => {
      const heat = {
        lowest: threshold1,
        low: threshold2,
        mid: threshold3,
        high: threshold4,
        highest: threshold5,
      };
      params.update({ data: { heat } });

      if (params.isCrowdMapOn() && !params.isSessionSelected()) {
        updateCrowdMapLayer.call(sessions.streamIds());
      } else if (params.isSessionSelected()) {
        sessions.redrawSelectedSession();
      } else {
        sessions.drawSessionsInLocation();
      }
    }
  );

  elmApp.ports.toggleIsSearchOn.subscribe((isSearchAsIMoveOn) => {
    params.update({ data: { isSearchAsIMoveOn: isSearchAsIMoveOn } });
  });

  elmApp.ports.fetchSessions.subscribe(() => {
    sessions.fetch();
  });

  elmApp.ports.pulseSessionMarker.subscribe((sessionMarkerData) => {
    if (sessionMarkerData === null) {
      pulsatingSessionMarker.setMap(null);
      return;
    }

    if (window.__map.clusterers[0]) {
      const cluster = window.__map.clusterers[0].clusters.find((cluster) =>
        cluster.markers.some(
          (marker) => marker.streamId() === sessionMarkerData.streamId
        )
      );

      if (cluster) {
        pulsatingSessionMarker = map.drawPulsatingMarker(
          cluster.position,
          sessionMarkerData.heatLevel
        );
        return;
      }
    }

    window.__map.customMarkers.forEach((marker) => {
      if (marker.streamId() === sessionMarkerData.streamId) {
        marker.moveOnTop();
        return;
      }
    });

    pulsatingSessionMarker = map.drawPulsatingMarker(
      sessionMarkerData.location,
      sessionMarkerData.heatLevel
    );
  });

  elmApp.ports.saveScrollPosition.subscribe((value) => {
    params.update({ scroll: value });
  });

  elmApp.ports.selectSensorId.subscribe((sensorId) => {
    sessions.deselectSession();
    params.update({ data: { sensorId } });
    sessions.fetch();
  });

  map.onPanOrZoom(() => {
    FiltersUtils.clearLocation(elmApp.ports.locationCleared.send, params);
  });

  FiltersUtils.setupProfileNamesAutocomplete((selectedValue) =>
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
      unit_symbol: sensors.selected().unit_symbol,
    };

    return sessions.isMobile()
      ? obj
      : { ...obj, is_indoor: data.isIndoor, is_active: data.isActive };
  };

  FiltersUtils.setupTagsAutocomplete(
    (selectedValue) => elmApp.ports.tagSelected.send(selectedValue),
    sessions.isMobile()
      ? "api/mobile/autocomplete/tags"
      : "api/fixed/autocomplete/tags",
    createTagsFilterParams
  );

  elmApp.ports.updateTags.subscribe((tags) => {
    params.update({ data: { tags: tags.join(", ") } });
    sessions.fetch();
  });

  elmApp.ports.updateProfiles.subscribe((profiles) => {
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

  elmApp.ports.showCopyLinkTooltip.subscribe((tooltipId) => {
    const currentUrl = encodeURIComponent(window.location.href);

    FiltersUtils.fetchShortUrl(tooltipId, currentUrl);
  });

  elmApp.ports.toggleTheme.subscribe((theme) => {
    const cb = sessions.isMobile()
      ? () => {
          if (!!params.selectedStreamId()) {
            sessions.redrawSelectedSession();
          }
        }
      : () => {};
    params.update({ theme: theme });
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

  FiltersUtils.setupTimeRangeFilter(
    onTimeRangeChanged,
    params.get("data").timeFrom,
    params.get("data").timeTo,
    elmApp.ports.isShowingTimeRangeFilter.send
  );

  const resetTimeRangeFilter = () => {
    FiltersUtils.setupTimeRangeFilter(
      onTimeRangeChanged,
      FiltersUtils.oneYearAgo(),
      FiltersUtils.endOfToday(),
      elmApp.ports.isShowingTimeRangeFilter.send
    );
    onTimeRangeChanged(FiltersUtils.oneYearAgo(), FiltersUtils.endOfToday());
  };

  elmApp.ports.refreshTimeRange.subscribe(() => {
    resetTimeRangeFilter();
  });

  // mobile tab
  elmApp.ports.toggleCrowdMap.subscribe((crowdMap) => {
    params.updateData({ crowdMap });

    sessions.toggleCrowdMapView();
  });

  // mobile tab
  elmApp.ports.updateResolution.subscribe((gridResolution) => {
    params.updateData({ gridResolution });
    updateCrowdMapLayer.call(sessions.streamIds());
  });

  // fixed tab
  elmApp.ports.toggleIndoor.subscribe((isIndoor) => {
    params.update({ data: { isIndoor: isIndoor } });
    sessions.fetch();
  });

  // fixed tab
  elmApp.ports.toggleActive.subscribe((isActive) => {
    params.update({ data: { isActive } });
    resetTimeRangeFilter();
    sessions.fetch();
  });
})();
