import _ from "underscore";
import constants from "../../../javascript/constants";
import * as Session from "../../../javascript/values/session";
import { calculateBounds } from "../../../javascript/calculateBounds";
import { clearMap } from "../../../javascript/clearMap";
import { sessionsInfoForElm } from "../../../javascript/sessionListUtils";
import heat_ from "../../../javascript/heat";
import sensors_ from "../../../javascript/sensors";
import infoWindow_ from "../../../javascript/infoWindow";
import params_ from "../../../javascript/params2";
import map_ from "../../../javascript/map";

const fixedSessions_ = (heat, infoWindow, map, params, sensors) => (
  $rootScope,
  sessionsDownloader,
  $window
) => {
  var FixedSessions = function() {
    this.sessions = [];
    this.scope = $rootScope.$new();
    this.scope.params = params;
    this.fetchableSessionsCount = 0;
    this.type = "FixedSessions";
  };

  let prevMapPosition = {};
  if (params.isSessionSelected()) {
    prevMapPosition = params.get("prevMapPosition");
  } else {
    prevMapPosition = {
      bounds: map.getBounds(),
      zoom: map.getZoom()
    };
  }

  FixedSessions.prototype = {
    isMobile: () => false,

    allSessionIds: function() {
      return _(this.get()).pluck("id");
    },

    get: function() {
      return _.uniq(this.sessions, "id");
    },

    isSelected: function(session) {
      return params.selectedSessionId() === session.id;
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
      if (!params.isSessionSelected()) return;
      params.update({ prevMapPosition: {} });
      params.update({ selectedSessionIds: [] });
      clearMap();
      map.fitBounds(prevMapPosition.bounds, prevMapPosition.zoom);
      this.fetch({ amount: params.paramsData["fetchedSessionsCount"] });
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

    redrawSelectedSession: function() {
      this.drawSessionsInLocation();
    },

    drawSessionsInLocation: function() {
      clearMap();
      if (params.get("data").isIndoor) return;

      const sessions = this.get();

      if (!params.get("data").isActive) {
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
      if (params.isSessionSelected()) return;
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
    "/api/fixed_region.json",
    data,
    cluster.getCenter(),
    constants.fixedSession
  );
};

export const fixedSessions = fixedSessions_(
  heat_,
  infoWindow_,
  map_,
  params_,
  sensors_
);
export const fixedSessionsTest = (heat, infoWindow, map, params, sensors) =>
  fixedSessions_(heat, infoWindow, map, params, sensors);
