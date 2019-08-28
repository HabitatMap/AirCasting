import _ from "underscore";
import constants from "../../../javascript/constants";
import * as Session from "../../../javascript/values/session";
import { calculateBounds } from "../../../javascript/calculateBounds";
import { clearMap } from "../../../javascript/mapsUtils";
import { sessionsInfoForElm } from "../../../javascript/sessionListUtils";

export const fixedSessions = (
  params,
  $http,
  map,
  sensors,
  $rootScope,
  sessionsDownloader,
  drawSession,
  sessionsUtils,
  $window,
  heat,
  infoWindow
) => {
  var FixedSessions = function() {
    this.sessions = [];
    this.scope = $rootScope.$new();
    this.scope.params = params;
    this.fetchableSessionsCount = 0;
    this.type = "FixedSessions";
  };

  let prevMapPosition = {};
  if (sessionsUtils.isSessionSelected()) {
    prevMapPosition = params.get("prevMapPosition");
  } else {
    prevMapPosition = {
      bounds: map.getBounds(),
      zoom: map.getZoom()
    };
  }

  FixedSessions.prototype = {
    allSessionIds: function() {
      return sessionsUtils.allSessionIds(this);
    },

    get: function() {
      return sessionsUtils.get(this);
    },

    isSelected: function(session) {
      return sessionsUtils.isSelected(this, session);
    },

    onSessionsFetch: function(fetchableSessionsCount) {
      $window.__elmApp.ports.updateSessions.send(
        sessionsInfoForElm(
          this.sessions,
          fetchableSessionsCount || this.fetchableSessionsCount,
          sensors.selectedSensorName()
        )
      );

      this.drawSessionsInLocation();
      if (fetchableSessionsCount) {
        this.fetchableSessionsCount = fetchableSessionsCount;
      }
    },

    deselectSession: function() {
      if (!sessionsUtils.isSessionSelected()) return;
      params.update({ prevMapPosition: {} });
      params.update({ selectedSessionIds: [] });
      clearMap();
      map.fitBounds(prevMapPosition.bounds, prevMapPosition.zoom);
    },

    selectSession: function(session) {
      params.update({ selectedSessionIds: [session.id] });

      if (!session.is_indoor) {
        prevMapPosition = {
          bounds: map.getBounds(),
          zoom: map.getZoom()
        };
        params.update({ prevMapPosition: prevMapPosition });
        map.fitBoundsWithBottomPadding(calculateBounds(session));
        this.drawSelectedSession(session);
      }
    },

    drawSelectedSession: function(session) {
      if (params.isActive()) {
        this.drawMarkersWithLabel(session);
      } else {
        this.drawMarkersWithoutLabel(session);
      }
    },

    downloadSessions: function(url, reqData) {
      sessionsDownloader(
        url,
        reqData,
        this.sessions,
        params,
        _(this.onSessionsFetch).bind(this)
      );
    },

    drawSessionsInLocation: function() {
      clearMap();
      if (params.get("data").isIndoor) return;

      const sessions = this.get();

      if (!sensors.anySelected() || !params.get("data").isActive) {
        sessions.forEach(session => this.drawMarkersWithoutLabel(session));
        return;
      }

      sessions.forEach(session =>
        this.drawMarkersWithLabel(session, sensors.selectedSensorName())
      );

      map.clusterMarkers(
        showClusterInfo(sensors.selectedSensorName(), map, infoWindow)
      );
    },

    drawMarkersWithLabel: function(session, selectedSensor) {
      const content = Session.lastHourAverageValueAndUnit(
        session,
        selectedSensor
      );
      const heatLevel = heat.levelName(Session.lastHourRoundedAverage(session));
      const latLng = Session.latLng(session);
      const callback = id => () =>
        $rootScope.$broadcast("markerSelected", { session_id: id });

      const marker = map.drawMarkerWithLabel({
        object: {
          latLng,
          id: Session.id(session),
          value: Session.lastHourRoundedAverage(session)
        },
        content: content,
        colorClass: heatLevel,
        callback: callback(Session.id(session))
      });
    },

    drawMarkersWithoutLabel: function(session) {
      const latLng = Session.latLng(session);
      const callback = id => () =>
        $rootScope.$broadcast("markerSelected", { session_id: id });

      const customMarker = map.drawMarkerWithoutLabel({
        object: { latLng },
        colorClass: "default",
        callback: callback(Session.id(session))
      });
    },

    fetch: function(values = {}) {
      if (sessionsUtils.isSessionSelected()) return;
      const limit = values.amount || 100;
      const offset = values.fetchedSessionsCount || 0;

      const data = params.get("data");

      if (!data.timeFrom || !data.timeTo) return;

      var reqData = {
        time_from: data.timeFrom,
        time_to: data.timeTo,
        tags: data.tags,
        usernames: data.usernames
      };

      if (data.isIndoor) {
        reqData = { ...reqData, is_indoor: true };
      } else {
        _(reqData).extend({
          west: map.getBounds().west,
          east: map.getBounds().east,
          south: map.getBounds().south,
          north: map.getBounds().north,
          limit,
          offset
        });
      }

      if (sensors.selected()) {
        _(reqData).extend({
          sensor_name: sensors.selected().sensor_name,
          measurement_type: sensors.selected().measurement_type,
          unit_symbol: sensors.selected().unit_symbol
        });
      }
      clearMap();

      if (offset === 0) this.sessions = [];

      if (data.isActive) {
        this.downloadSessions("/api/fixed/active/sessions.json", reqData);
      } else {
        this.downloadSessions("/api/fixed/dormant/sessions.json", reqData);
      }
    }
  };
  return new FixedSessions();
};

export const showClusterInfo = (sensorName, map, infoWindow) => cluster => {
  map.setSelectedCluster(cluster);

  const data = {
    q: {
      session_ids: cluster.getMarkers().map(marker => marker.objectId()),
      sensor_name: sensorName
    }
  };

  infoWindow.show(
    "/api/fixed_region",
    data,
    cluster.getCenter(),
    constants.fixedSession
  );
};
