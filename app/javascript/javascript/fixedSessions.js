import _ from "underscore";
import constants from "./constants";
import * as Session from "./session";
import { calculateBounds } from "./calculateBounds";
import { clearMap } from "./clearMap";
import { sessionsInfoForElm } from "./sessionListUtils";
import heat from "./heat";
import sensors from "./sensors";
import infoWindow from "./infoWindow";
import params from "./params2";
import map from "./map";
import sessionsDownloader from "./sessionsDownloader";
import pubsub from "./pubsub";

export default (() => {
  var FixedSessions = function () {
    this.sessions = [];
    this.fetchableSessionsCount = 0;
    this.type = "FixedSessions";
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

  FixedSessions.prototype = {
    isMobile: () => false,

    get: function () {
      return _.uniq(this.sessions, "id");
    },

    isSelected: function (session) {
      return params.selectedStreamId() === session.stream.id;
    },

    onSessionsFetch: function (fetchableSessionsCount) {
      window.__elmApp.ports.updateSessions.send(
        sessionsInfoForElm(this.sessions, fetchableSessionsCount || this.fetchableSessionsCount)
      );

      this.drawSessionsInLocation();
      if (fetchableSessionsCount) {
        this.fetchableSessionsCount = fetchableSessionsCount;
      }
    },

    deselectSession: function () {
      if (!params.isSessionSelected()) return;
      params.update({ prevMapPosition: {} });
      params.update({ selectedStreamId: null });
      clearMap();
      map.fitBounds(prevMapPosition.bounds, prevMapPosition.zoom);
      this.fetch({ amount: params.paramsData["fetchedSessionsCount"] });
    },

    selectSession: function (session) {
      params.update({ selectedStreamId: session.stream.id });

      if (!session.is_indoor) {
        prevMapPosition = {
          bounds: map.getBounds(),
          zoom: map.getZoom(),
        };
        params.update({ prevMapPosition: prevMapPosition });
        map.fitBoundsWithBottomPadding(calculateBounds(session));
        this.drawSelectedSession(session);
      }
    },

    drawSelectedSession: function (session) {
      if (params.isActive()) {
        this.drawMarkersWithLabel(session);
      } else {
        this.drawMarkersWithoutLabel(session);
      }
    },

    downloadSessions: function (url, reqData) {
      sessionsDownloader(
        url,
        reqData,
        this.sessions,
        _(this.onSessionsFetch).bind(this)
      );
    },

    redrawSelectedSession: function () {
      this.drawSessionsInLocation();
    },

    drawSessionsInLocation: function () {
      clearMap();
      if (params.get("data").isIndoor) return;

      const sessions = this.get();

      if (!params.get("data").isActive) {
        sessions.forEach((session) => this.drawMarkersWithoutLabel(session));
        return;
      }

      sessions.forEach((session) => this.drawMarkersWithLabel(session));
      map.clusterMarkers(showClusterInfo(sensors.selectedSensorName()));
    },

    drawMarkersWithLabel: function (session) {
      const content = Session.lastMeasurementValueAndUnit(session);
      const heatLevel = heat.levelName(Session.lastMeasurementRoundedValue(session));
      const latLng = Session.latLng(session);
      const callback = (streamId) => () => pubsub.publish("markerSelected", { streamId });

      map.drawMarkerWithLabel({
        object: {
          latLng,
          streamId: Session.streamId(session),
          value: Session.lastMeasurementRoundedValue(session),
        },
        content: content,
        colorClass: heatLevel,
        callback: callback(Session.streamId(session)),
      });
    },

    drawMarkersWithoutLabel: function (session) {
      const latLng = Session.latLng(session);
      const callback = (streamId) => () => pubsub.publish("markerSelected", { streamId });

      map.drawMarkerWithoutLabel({
        object: { latLng },
        colorClass: "default",
        callback: callback(Session.streamId(session)),
      });
    },

    fetch: function (values = {}) {
      if (params.isSessionSelected()) return;
      const limit = values.amount || 100;
      const offset = values.fetchedSessionsCount || 0;

      const data = params.get("data");

      if (!data.timeFrom || !data.timeTo) return;

      var reqData = {
        time_from: data.timeFrom,
        time_to: data.timeTo,
        tags: data.tags,
        usernames: data.usernames,
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
          offset,
        });
      }

      if (sensors.selected()) {
        _(reqData).extend({
          sensor_name: sensors.selected().sensor_name,
          measurement_type: sensors.selected().measurement_type,
          unit_symbol: sensors.selected().unit_symbol,
        });
      }
      clearMap();

      if (offset === 0) this.sessions = [];

      if (data.isActive) {
        this.downloadSessions("/api/fixed/active/sessions2.json", reqData);
      } else {
        this.downloadSessions("/api/fixed/dormant/sessions.json", reqData);
      }
    },
  };
  return new FixedSessions();
})();

export const showClusterInfo = (sensorName) => (_event, cluster) => {
  map.setSelectedCluster(cluster);

  const params = {
    stream_ids: cluster.markers.map((marker) => marker.streamId()),
  };

  infoWindow.show({
    url: "/api/fixed_region.json",
    params,
    position: cluster.position,
    sessionType: constants.fixedSession,
  });
};
