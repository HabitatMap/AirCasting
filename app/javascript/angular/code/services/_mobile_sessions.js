import _ from "underscore";
import * as Session from "../../../javascript/values/session";
import { clusterer } from "../../../javascript/clusterer";
import { calculateBounds } from "../../../javascript/calculateBounds";
import { prepareSessionData } from "./_sessions_utils";

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
    this.selectedSession = {};
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
      if (!sessionsUtils.isSessionSelected()) return;
      this.selectedSession = {};
      params.update({ prevMapPosition: {} });
      params.update({ selectedSessionIds: [] });
      drawSession.undoDraw({}, prevMapPosition);
    },

    selectSession: function(id) {
      const callback = rawData => {
        this.selectedSession = prepareSessionData(rawData);
        drawSession.clear(this.sessions);
        prevMapPosition = {
          bounds: map.getBounds(),
          zoom: map.getZoom()
        };
        params.update({ prevMapPosition: prevMapPosition });

        map.fitBoundsWithBottomPadding(
          calculateBounds(sensors, this.selectedSession)
        );

        const drawSessionStartingMarker = (selectedSession, sensorName) =>
          this.drawSessionWithLabel(selectedSession, sensorName);
        drawSession.drawMobileSession(
          this.selectedSession,
          drawSessionStartingMarker
        );

        sessionsUtils.updateCrowdMapLayer();
      };

      params.update({ selectedSessionIds: [id] });
      this._selectSession(id, callback);
    },

    // this is called when refreshing a page with selected session
    reSelectSession: function(id) {
      const callback = rawData => {
        this.selectedSession = prepareSessionData(rawData);

        map.fitBoundsWithBottomPadding(
          calculateBounds(sensors, this.selectedSession)
        );

        const drawSessionStartingMarker = (selectedSession, sensorName) =>
          this.drawSessionWithLabel(selectedSession, sensorName);
        drawSession.drawMobileSession(
          this.selectedSession,
          drawSessionStartingMarker
        );

        sessionsUtils.updateCrowdMapLayer();
      };
      this._selectSession(id, callback);
    },

    redrawSelectedSession: function() {
      const drawSessionStartingMarker = (selectedSession, sensorName) =>
        this.drawSessionWithLabel(selectedSession, sensorName);

      drawSession.drawMobileSession(
        this.selectedSession,
        drawSessionStartingMarker
      );
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
      return marker;
    },

    _selectSession: function(id, callback) {
      var sensorId = sensors.selectedId();
      var sensor = sensors.sensors[sensorId] || {};
      var sensorName = sensor.sensor_name;
      if (!sensorName) return;
      $http
        .get("/api/mobile/sessions2/" + id, {
          cache: true,
          params: { sensor_name: sensorName }
        })
        .success(callback);
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
