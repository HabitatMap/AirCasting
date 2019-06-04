import _ from "underscore";
import * as Session from "../../../javascript/values/session";
import { clusterer } from "../../../javascript/clusterer";
import { calculateBounds } from "../../../javascript/calculateBounds";

export const mobileSessions = (
  params,
  $http,
  map,
  sensors,
  $rootScope,
  sessionsDownloader,
  drawSession,
  sessionsUtils,
  heat,
  $window
) => {
  var MobileSessions = function() {
    this.sessions = [];
    this.scope = $rootScope.$new();
    this.scope.params = params;
    this.fetchableSessionsCount = 0;
    this.type = "MobileSessions";
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

  const TIMEOUT_DELAY = process.env.NODE_ENV === "test" ? 0 : 3000;

  MobileSessions.prototype = {
    sessionIds: function() {
      return this.sessions.map(x => x.id);
    },

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
      if (!params.isCrowdMapOn()) {
        this.drawSessionsInLocation();
      }
      if (fetchableSessionsCount) {
        this.fetchableSessionsCount = fetchableSessionsCount;
      }
      if (sessionsUtils.isSessionSelected()) {
        this.reSelectSession(sessionsUtils.selectedSessionId());
      }
    },

    onSessionsFetchWithCrowdMapLayerUpdate: function(fetchableSessionsCount) {
      this.onSessionsFetch(fetchableSessionsCount);
      sessionsUtils.updateCrowdMapLayer(this.sessionIds());
    },

    toggleCrowdMapView: function() {
      if (params.isCrowdMapOn()) {
        drawSession.clear(this.sessions);
        sessionsUtils.updateCrowdMapLayer(this.sessionIds());
      } else {
        map.clearRectangles();
        this.drawSessionsInLocation();
      }
    },

    deselectSession: function() {
      const session = sessionsUtils.selectedSession(this);
      if (!session) return;
      session.loaded = false;
      params.update({ prevMapPosition: {} });
      params.update({ selectedSessionIds: [] });
      drawSession.undoDraw(session, prevMapPosition);
    },

    selectSession: function(id) {
      const callback = session => data => {
        drawSession.clear(this.sessions);
        prevMapPosition = {
          bounds: map.getBounds(),
          zoom: map.getZoom()
        };
        params.update({ prevMapPosition: prevMapPosition });

        const drawSessionStartingMarker = (session, sensorName) =>
          this.drawSessionWithLabel(session, sensorName);
        const draw = () =>
          drawSession.drawMobileSession(session, drawSessionStartingMarker);
        map.fitBoundsWithBottomPadding(
          calculateBounds(sensors, session, map.getZoom())
        );
        sessionsUtils.onSingleSessionFetch(session, data, draw);
      };
      params.update({ selectedSessionIds: [id] });
      this._selectSession(id, callback);
    },

    // this is called when refreshing a page with selected session
    reSelectSession: function(id) {
      // this must happen before everything else, otherwise the session is drawn on the map and removed right away
      drawSession.clear(this.sessions);
      setTimeout(() => {
        const callback = session => data => {
          const drawSessionStartingMarker = (session, sensorName) =>
            this.drawSessionWithLabel(session, sensorName);
          const draw = () =>
            drawSession.drawMobileSession(session, drawSessionStartingMarker);
          sessionsUtils.onSingleSessionFetch(session, data, draw);
        };
        this._selectSession(id, callback);
      }, TIMEOUT_DELAY);
    },

    redrawSelectedSession: function(id) {
      const session = this.find(id);
      if (!session) return;

      const drawSessionStartingMarker = (session, sensorName) =>
        this.drawSessionWithLabel(session, sensorName);

      drawSession.drawMobileSession(session, drawSessionStartingMarker);
    },

    drawSessionsInLocation: function() {
      if (!sensors.anySelected()) return;

      const sessions = this.get();
      const sessionsToCluster = [];
      sessions.forEach(session => {
        sessionsToCluster.push({
          latLng: Session.startingLatLng(session, sensors.selectedSensorName()),
          object: session
        });
      });

      const clusteredSessions = clusterer(sessionsToCluster, map);
      const lonelySessions = sessions.filter(isNotIn(clusteredSessions));

      clusteredSessions.forEach(session => {
        this.drawSessionWithoutLabel(session, sensors.selectedSensorName());
      });
      lonelySessions.forEach(session => {
        this.drawSessionWithLabel(session, sensors.selectedSensorName());
      });
    },

    drawSessionWithoutLabel: function(session, selectedSensor) {
      drawSession.undoDraw(session);
      session.markers = [];

      const heatLevel = heat.levelName(
        Session.roundedAverage(session, selectedSensor)
      );
      const latLng = Session.startingLatLng(session, selectedSensor);
      const callback = id => () =>
        $rootScope.$broadcast("markerSelected", { session_id: id });

      const marker = map.drawMarkerWithoutLabel({
        object: { latLng },
        colorClass: heatLevel,
        callback: callback(Session.id(session))
      });
      session.markers.push(marker);
    },

    drawSessionWithLabel: function(session, selectedSensor) {
      drawSession.undoDraw(session);
      session.markers = [];

      const content = Session.averageValueAndUnit(session, selectedSensor);
      const heatLevel = heat.levelName(
        Session.roundedAverage(session, selectedSensor)
      );
      const latLng = Session.startingLatLng(session, selectedSensor);
      const callback = id => () =>
        $rootScope.$broadcast("markerSelected", { session_id: id });

      const marker = map.drawMarkerWithLabel({
        object: { latLng },
        content: content,
        colorClass: heatLevel,
        callback: callback(Session.id(session))
      });
      session.markers.push(marker);
    },

    _selectSession: function(id, callback) {
      const session = sessionsUtils.selectedSession(this);
      if (!session) return;
      var sensorId = sensors.selectedId();
      var sensor = sensors.sensors[sensorId] || {};
      var sensorName = sensor.sensor_name;
      if (!sensorName) return;
      $http
        .get("/api/mobile/sessions2/" + id, {
          cache: true,
          params: { sensor_name: sensorName }
        })
        .success(callback(session));
    },

    fetch: function(values = {}) {
      const limit = values.amount || 50;
      const offset = values.fetchedSessionsCount || 0;

      var bounds = map.getBounds();
      var data = params.get("data");
      if (!data.timeFrom || !data.timeTo) return;
      var reqData = {
        time_from: data.timeFrom,
        time_to: data.timeTo,
        tags: data.tags,
        usernames: data.usernames,
        session_ids: params.selectedSessionIds()
      };

      _(reqData).extend({
        west: bounds.west,
        east: bounds.east,
        south: bounds.south,
        north: bounds.north,
        limit: limit,
        offset: offset
      });

      if (sensors.selected()) {
        _(reqData).extend({
          sensor_name: sensors.selected().sensor_name,
          measurement_type: sensors.selected().measurement_type,
          unit_symbol: sensors.selected().unit_symbol
        });
      }

      drawSession.clear(this.sessions);

      if (sessionsUtils.isSessionSelected()) {
        sessionsDownloader(
          "/api/multiple_sessions.json",
          reqData,
          this.sessions,
          params,
          _(this.onSessionsFetch).bind(this),
          _(this.onSessionsFetchError).bind(this)
        );
      } else {
        if (offset === 0) this.sessions = [];

        sessionsDownloader(
          "/api/mobile/sessions.json",
          reqData,
          this.sessions,
          params,
          _(this.onSessionsFetchWithCrowdMapLayerUpdate).bind(this),
          _(this.onSessionsFetchError).bind(this)
        );
      }
    }
  };
  return new MobileSessions();
};

const isNotIn = arr => x => !arr.includes(x);
