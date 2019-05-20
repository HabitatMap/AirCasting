import _ from "underscore";
import { debounce } from "debounce";
import constants from "../constants";
import * as Session from "../values/session";
import { calculateBounds } from "../calculateBounds";

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
  if (params.get("selectedSessionIds").length === 1) {
    prevMapPosition = params.get("prevMapPosition");
  } else {
    prevMapPosition = {
      bounds: map.getBounds(),
      zoom: map.getZoom()
    };
  }

  FixedSessions.prototype = {
    allSelected: function() {
      return sessionsUtils.allSelected(this);
    },

    allSessionIds: function() {
      return sessionsUtils.allSessionIds(this);
    },

    deselectAllSessions: function() {
      sessionsUtils.deselectAllSessions();
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

    reSelectAllSessions: function() {
      sessionsUtils.reSelectAllSessions(this);
    },

    selectAllSessions: function() {
      sessionsUtils.selectAllSessions(this);
    },

    sessionsChanged: function(newIds, oldIds) {
      sessionsUtils.sessionsChanged(this, newIds, oldIds);
    },

    onSessionsFetch: function(fetchableSessionsCount) {
      if ($window.location.pathname !== constants.fixedMapRoute) return;

      this.drawSessionsInLocation();
      if (fetchableSessionsCount) {
        this.fetchableSessionsCount = fetchableSessionsCount;
      }
      sessionsUtils.onSessionsFetch(this);
    },

    deselectSession: function(id) {
      var session = this.find(id);
      if (!session) return;
      session.loaded = false;
      session.alreadySelected = false;
      params.update({ prevMapPosition: {} });
      map.fitBounds(prevMapPosition.bounds, prevMapPosition.zoom);
    },

    selectSession: function(id) {
      const session = this.find(id);
      const allSelected = this.allSelected();
      const fitBounds = () => {
        if (!session.is_indoor) {
          prevMapPosition = {
            bounds: map.getBounds(),
            zoom: map.getZoom()
          };
          params.update({ prevMapPosition: prevMapPosition });
          map.fitBoundsWithBottomPadding(
            calculateBounds(sensors, allSelected, map.getZoom())
          );
        }
      };
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
        sessions.forEach(session => this.drawDefaultMarkers(session));
        return;
      }

      sessions.forEach(session =>
        this.drawColorCodedMarkers(session, sensors.selectedSensorName())
      );

      map.clusterMarkers(
        showClusterInfo(sensors.selectedSensorName(), map, infoWindow)
      );
    },

    drawColorCodedMarkers: function(session, selectedSensor) {
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

      const marker = map.drawCustomMarker({
        object: {
          latLng,
          id: Session.id(session),
          value: Session.lastHourRoundedAverage(session)
        },
        content: content,
        colorClass: heatLevel,
        callback: callback(Session.id(session)),
        type: "data-marker"
      });
      session.markers.push(marker);
    },

    drawDefaultMarkers: function(session) {
      drawSession.undoDraw(session);
      session.markers = [];

      const latLng = Session.latLng(session);
      const callback = id => () =>
        $rootScope.$broadcast("markerSelected", { session_id: id });

      const customMarker = map.drawCustomMarker({
        object: { latLng },
        colorClass: "default",
        callback: callback(Session.id(session)),
        type: "marker"
      });
      session.markers.push(customMarker);
    },

    _fetch: function(values = {}) {
      // if _fetch is called after the route has changed (eg debounced)
      if ($window.location.pathname !== constants.fixedMapRoute) return;
      const limit = values.amount || 50;
      const offset = values.fetchedSessionsCount || 0;

      const data = params.get("data");

      // _.values suggests that `params.get('selectedSessionIds')` could be an obj, is it true?
      const sessionIds = _.values(params.get("selectedSessionIds") || []);

      if (!data.timeFrom || !data.timeTo) return;

      var reqData = {
        time_from: data.timeFrom,
        time_to: data.timeTo,
        tags: data.tags,
        usernames: data.usernames,
        session_ids: sessionIds
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

      if (params.get("selectedSessionIds").length === 1) {
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
    },

    fetch: debounce(function(values) {
      this._fetch(values);
    }, 750)
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
