import _ from "underscore";
import { keysToLowerCase } from "../utils.js";

export const sessionsUtils = (
  params,
  sensors,
  $timeout,
  flash,
  updateCrowdMapLayer
) => ({
  sessionsChanged: function(self, newIds, oldIds) {
    _(newIds)
      .chain()
      .difference(oldIds)
      .each(_(self.selectSession).bind(self));
    _(oldIds)
      .chain()
      .difference(newIds)
      .each(_(self.deselectSession).bind(self));
  },

  get: function(self) {
    return _.uniq(self.sessions, "id");
  },

  allSessionIds: function(self) {
    return _(self.get()).pluck("id");
  },

  onSessionsFetch: function(self) {
    self.reSelectAllSessions();
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

  deselectAllSessions: function() {
    params.update({ selectedSessionIds: [] });
  },

  selectAllSessions: function(self) {
    params.update({ selectedSessionIds: self.allSessionIds() });
  },

  reSelectAllSessions: function(self) {
    _(params.get("selectedSessionIds")).each(function(id) {
      self.reSelectSession(id);
    });
  },

  isSelected: function(self, session) {
    return _(self.allSelected()).include(session);
  },

  allSelected: function(self) {
    return _(params.selectedSessionIds())
      .chain()
      .map(function(id) {
        return self.find(id);
      })
      .compact()
      .value();
  },

  isSessionSelected: function() {
    params.selectedSessionIds().length === 1;
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
