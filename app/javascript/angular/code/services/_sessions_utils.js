import _ from "underscore";
import { keysToLowerCase } from "../utils.js";

export const sessionsUtils = (
  params,
  sensors,
  $timeout,
  flash,
  updateCrowdMapLayer
) => ({
  sessionsChanged: (self, newIds, oldIds) => {
    _(newIds)
      .chain()
      .difference(oldIds)
      .each(_(self.selectSession).bind(self));
    _(oldIds)
      .chain()
      .difference(newIds)
      .each(_(self.deselectSession).bind(self));
  },

  get: self => {
    return _.uniq(self.sessions, "id");
  },

  allSessionIds: self => {
    return _(self.get()).pluck("id");
  },

  noOfSelectedSessions: self => {
    return self.allSelected().length;
  },

  empty: self => {
    return self.noOfSelectedSessions() === 0;
  },

  onSessionsFetch: self => {
    self.reSelectAllSessions();
  },

  updateCrowdMapLayer: sessionIds => {
    updateCrowdMapLayer.call(sessionIds);
  },

  onSessionsFetchError: data => {
    var errorMsg = data.error || "There was an error, sorry";
    flash.set(errorMsg);
  },

  find: (self, id) => {
    return _(self.sessions || []).detect(function(session) {
      return session.id === id;
    });
  },

  deselectAllSessions: () => {
    params.update({ selectedSessionIds: [] });
  },

  selectAllSessions: self => {
    params.update({ selectedSessionIds: self.allSessionIds() });
  },

  reSelectAllSessions: self => {
    _(params.get("selectedSessionIds")).each(function(id) {
      self.reSelectSession(id);
    });
  },

  isSelected: (self, session) => {
    return _(self.allSelected()).include(session);
  },

  allSelected: self => {
    return _(self.allSelectedIds())
      .chain()
      .map(function(id) {
        return self.find(id);
      })
      .compact()
      .value();
  },

  allSelectedIds: () => {
    return params.get("selectedSessionIds");
  },

  onSingleSessionFetch: (session, data, callback) => {
    createSessionData(session, data);
    session.loaded = true;
    callback();
    this.updateCrowdMapLayer([session.id]);
  },

  onSingleSessionFetchWithoutCrowdMap: (session, data, callback) => {
    createSessionData(session, data);
    session.loaded = true;
    callback();
  },
  refreshMapView: sessions => {
    if (sessions.type === "MobileSessions") {
      sessions.onSessionsFetchWithCrowdMapLayerUpdate();
    } else if (sessions.type === "FixedSessions") {
      sessions.onSessionsFetch();
    } else {
      console.warn("Incorrect sessions type: ", sessions.type);
    }
  }
});

const createSessionData = (session, data) => {
  const streams = keysToLowerCase(data.streams);
  delete data.streams;
  _(session).extend(data);
  _(session.streams).extend(streams);
};
