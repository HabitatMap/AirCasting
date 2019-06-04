import _ from "underscore";
import { keysToLowerCase } from "../../../javascript/utils.js";

export const sessionsUtils = (
  params,
  sensors,
  $timeout,
  flash,
  updateCrowdMapLayer
) => ({
  get: function(self) {
    return _.uniq(self.sessions, "id");
  },

  allSessionIds: function(self) {
    return _(self.get()).pluck("id");
  },

  updateCrowdMapLayer: function(sessionIds) {
    updateCrowdMapLayer.call(sessionIds);
  },

  onSessionsFetchError: function(data) {
    var errorMsg = data.error || "There was an error, sorry";
    flash.set(errorMsg);
  },

  find: function(self, id) {
    return _(self.sessions || []).detect(function(session) {
      return session.id === id;
    });
  },

  isSelected: function(self, session) {
    return this.selectedSessionId() === session.id;
  },

  isSessionSelected: function() {
    return params.selectedSessionIds().length === 1;
  },

  selectedSessionId: function() {
    return params.selectedSessionIds()[0];
  },

  selectedSession: function(self) {
    return this.find(self, this.selectedSessionId());
  },

  onSingleSessionFetch: function(session, data, callback) {
    createSessionData(session, data);
    session.loaded = true;
    callback();
    this.updateCrowdMapLayer();
  },

  onSingleSessionFetchWithoutCrowdMap: function(session, data, callback) {
    createSessionData(session, data);
    session.loaded = true;
    callback();
  },
  refreshMapView: function(sessions) {
    if (sessions.type === "MobileSessions") {
      sessions.onSessionsFetchWithCrowdMapLayerUpdate();
    } else if (sessions.type === "FixedSessions") {
      sessions.onSessionsFetch();
    } else {
      console.warn("Incorrect sessions type");
    }
  }
});

const createSessionData = (session, data) => {
  const streams = keysToLowerCase(data.streams);
  delete data.streams;
  _(session).extend(data);
  _(session.streams).extend(streams);
};
