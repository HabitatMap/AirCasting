import _ from "underscore";
import { calculateBounds } from "./calculateBounds";
import { clearMap } from "./clearMap";
import { clusterer } from "./clusterer";
import drawSession from "./drawSession";
import heat from "./heat";
import map from "./map";
import params from "./params2";
import pubsub from "./pubsub";
import sensors from "./sensors";
import * as Session from "./session";
import { sessionsInfoForElm } from "./sessionListUtils";
import sessionsDownloader from "./sessionsDownloader";
import updateCrowdMapLayer from "./updateCrowdMapLayer";

export default (() => {
  var MobileSessions = function () {
    this.sessions = [];
    this.fetchableSessionsCount = 0;
    this.type = "MobileSessions";
    this.selectedSession = {};
  };

  let prevMapPosition = {};
  if (params.isSessionSelected()) {
    prevMapPosition = params.get("prevMapPosition");
  } else {
    prevMapPosition = {
      bounds: map.getBounds(),
      zoom: map.getZoom(),
    };
  }

  MobileSessions.prototype = {
    isMobile: () => true,

    streamIds: function () {
      return this.sessions.map((x) => x.stream.id);
    },

    get: function () {
      return _.uniq(this.sessions, "id");
    },

    isSelected: function (session) {
      return params.selectedStreamId() === session.stream.id;
    },

    onSessionsFetch: function (fetchableSessionsCount) {
      if (!params.isCrowdMapOn()) {
        this.drawSessionsInLocation();
      }
      if (fetchableSessionsCount) {
        this.fetchableSessionsCount = fetchableSessionsCount;
      }
    },

    onSessionsFetchWithCrowdMapLayerUpdate: function (fetchableSessionsCount) {
      window.__elmApp.ports.updateSessions.send(
        sessionsInfoForElm(this.sessions, fetchableSessionsCount || this.fetchableSessionsCount)
      );

      this.onSessionsFetch(fetchableSessionsCount);
      updateCrowdMapLayer.call(this.streamIds());
    },

    toggleCrowdMapView: function () {
      clearMap();
      if (params.isCrowdMapOn()) {
        updateCrowdMapLayer.call(this.streamIds());
      } else {
        this.drawSessionsInLocation();
      }
    },

    deselectSession: function () {
      if (!params.isSessionSelected()) return;
      this.selectedSession = {};
      params.update({ prevMapPosition: {} });
      params.update({ selectedStreamId: null });
      clearMap();
      map.fitBounds(prevMapPosition.bounds, prevMapPosition.zoom);
      this.fetch({ amount: params.paramsData["fetchedSessionsCount"] });
    },

    selectSession: function (session) {
      if (!params.selectedStreamId()) {
        clearMap();
        prevMapPosition = {
          bounds: map.getBounds(),
          zoom: map.getZoom(),
        };
      }
      params.update({ selectedStreamId: session.stream.id });

      this.selectedSession = session;

      params.update({ prevMapPosition: prevMapPosition });

      map.fitBoundsWithBottomPadding(calculateBounds(session));

      const drawSessionStartingMarker = (selectedSession) =>
        this.drawSessionWithLabel(selectedSession);
      drawSession.drawMobileSession(session, drawSessionStartingMarker);
    },

    redrawSelectedSession: function () {
      clearMap();
      const drawSessionStartingMarker = (selectedSession) =>
        this.drawSessionWithLabel(selectedSession);

      drawSession.drawMobileSession(
        this.selectedSession,
        drawSessionStartingMarker
      );
    },

    drawSessionsInLocation: function () {
      clearMap();

      const sessions = this.get();
      const sessionsToCluster = [];
      sessions.forEach((session) => {
        sessionsToCluster.push({
          latLng: Session.startingLatLng(session),
          object: session,
        });
      });

      const clusteredSessions = clusterer(sessionsToCluster, map);
      const lonelySessions = sessions.filter(isNotIn(clusteredSessions));

      clusteredSessions.forEach((session) => this.drawSessionWithoutLabel(session));
      lonelySessions.forEach((session) => {
        this.drawSessionWithLabel(session);
      });
    },

    drawSessionWithoutLabel: function (session) {
      const heatLevel = heat.levelName(
        Session.roundedAverage(session)
      );
      const latLng = Session.startingLatLng(session);
      const callback = (streamId) => () => pubsub.publish("markerSelected", { streamId });

      map.drawMarkerWithoutLabel({
        object: { latLng, streamId: Session.streamId(session) },
        colorClass: heatLevel,
        callback: callback(Session.streamId(session)),
      });
    },

    drawSessionWithLabel: function (session) {
      const content = Session.averageValueAndUnit(session);
      const heatLevel = heat.levelName(
        Session.roundedAverage(session)
      );
      const latLng = Session.startingLatLng(session);
      const callback = (streamId) => () => pubsub.publish("markerSelected", { streamId });

      const marker = map.drawMarkerWithLabel({
        object: { latLng },
        content: content,
        colorClass: heatLevel,
        callback: callback(Session.streamId(session)),
      });
      return marker;
    },

    fetch: function (values = {}) {
      if (params.isSessionSelected()) return;
      const limit = values.amount || 100;
      const offset = values.fetchedSessionsCount || 0;

      var bounds = map.getBounds();
      var data = params.get("data");
      if (!data.timeFrom || !data.timeTo) return;
      var reqData = {
        time_from: data.timeFrom,
        time_to: data.timeTo,
        tags: data.tags,
        usernames: data.usernames,
      };

      _(reqData).extend({
        west: bounds.west,
        east: bounds.east,
        south: bounds.south,
        north: bounds.north,
        limit: limit,
        offset: offset,
      });

      if (sensors.selected()) {
        _(reqData).extend({
          sensor_name: sensors.selected().sensor_name,
          measurement_type: sensors.selected().measurement_type,
          unit_symbol: sensors.selected().unit_symbol,
        });
      }

      clearMap();

      if (offset === 0) this.sessions = [];

      sessionsDownloader(
        "/api/mobile/sessions.json",
        reqData,
        this.sessions,
        _(this.onSessionsFetchWithCrowdMapLayerUpdate).bind(this)
      );
    },
  };
  return new MobileSessions();
})();

const isNotIn = (arr) => (x) => !arr.includes(x);
