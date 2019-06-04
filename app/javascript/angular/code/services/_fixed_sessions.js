import _ from "underscore";
import constants from "../../../javascript/constants";
import * as Session from "../../../javascript/values/session";
import { calculateBounds } from "../../../javascript/calculateBounds";

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

    find: function(id) {
      return sessionsUtils.find(this, id);
    },

    get: function() {
      return sessionsUtils.get(this);
    },

    isSelected: function(session) {
      return sessionsUtils.isSelected(this, session);
    },

    onSessionsFetchError: function(data) {
      sessionsUtils.onSessionsFetchError(data);
    },

    onSessionsFetch: function(fetchableSessionsCount) {
      this.drawSessionsInLocation();
      if (fetchableSessionsCount) {
        this.fetchableSessionsCount = fetchableSessionsCount;
      }
      if (sessionsUtils.isSessionSelected()) {
        this.reSelectSession(sessionsUtils.selectedSessionId());
      }
    },

    deselectSession: function() {
      var session = this.find(sessionsUtils.selectedSessionId());
      if (!session) return;
      session.loaded = false;
      session.alreadySelected = false;
      params.update({ prevMapPosition: {} });
      params.update({ selectedSessionIds: [] });
      map.fitBounds(prevMapPosition.bounds, prevMapPosition.zoom);
    },

    selectSession: function(id) {
      const session = this.find(id);
      const fitBounds = () => {
        if (!session.is_indoor) {
          prevMapPosition = {
            bounds: map.getBounds(),
            zoom: map.getZoom()
          };
          params.update({ prevMapPosition: prevMapPosition });
          map.fitBoundsWithBottomPadding(
            calculateBounds(
              sensors,
              sessionsUtils.selectedSession(this),
              map.getZoom()
            )
          );
        }
      };
      params.update({ selectedSessionIds: [id] });
      this._selectSession(id, fitBounds);
    },

    reSelectSession: function(id) {
      const noop = () => {};
      this._selectSession(id, noop);
    },

    _selectSession: function(id, callback) {
      var session = this.find(id);
      if (!session || session.alreadySelected) return;
      var sensorId = sensors.selectedId();
      var sensor = sensors.sensors[sensorId] || {};
      var sensorName = sensor.sensor_name;
      if (!sensorName) return;
      session.alreadySelected = true;
      $http
        .get("/api/realtime/sessions/" + id, {
          cache: true,
          params: { sensor_id: sensorName }
        })
        .success(function(data) {
          sessionsUtils.onSingleSessionFetchWithoutCrowdMap(
            session,
            data,
            callback
          );
        });
    },

    downloadSessions: function(url, reqData) {
      sessionsDownloader(
        url,
        reqData,
        this.sessions,
        params,
        _(this.onSessionsFetch).bind(this),
        _(this.onSessionsFetchError).bind(this)
      );
    },

    drawSessionsInLocation: function() {
      map.removeAllMarkers();

      if (params.get("data").isIndoor) return;

      const sessions = this.get();

      if (!sensors.anySelected() || !params.get("data").isStreaming) {
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
      drawSession.undoDraw(session);
      session.markers = [];

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
      session.markers.push(marker);
    },

    drawMarkersWithoutLabel: function(session) {
      drawSession.undoDraw(session);
      session.markers = [];

      const latLng = Session.latLng(session);
      const callback = id => () =>
        $rootScope.$broadcast("markerSelected", { session_id: id });

      const customMarker = map.drawMarkerWithoutLabel({
        object: { latLng },
        colorClass: "default",
        callback: callback(Session.id(session))
      });
      session.markers.push(customMarker);
    },

    fetch: function(values = {}) {
      const limit = values.amount || 50;
      const offset = values.fetchedSessionsCount || 0;

      const data = params.get("data");

      if (!data.timeFrom || !data.timeTo) return;

      var reqData = {
        time_from: data.timeFrom,
        time_to: data.timeTo,
        tags: data.tags,
        usernames: data.usernames,
        session_ids: params.selectedSessionIds()
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

      drawSession.clear(this.sessions);

      if (sessionsUtils.isSessionSelected()) {
        this.downloadSessions("/api/realtime/multiple_sessions.json", reqData);
      } else {
        if (offset === 0) this.sessions = [];

        if (data.isStreaming) {
          this.downloadSessions(
            "/api/realtime/streaming_sessions.json",
            reqData
          );
        } else {
          this.downloadSessions("/api/fixed/dormant/sessions.json", reqData);
        }
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
