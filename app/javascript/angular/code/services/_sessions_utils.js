import _ from "underscore";
import { keysToLowerCase } from "../../../javascript/utils.js";

export const sessionsUtils = (
  params,
  sensors,
  $timeout,
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

  isSelected: function(self, session) {
    return this.selectedSessionId() === session.id;
  },

  isSessionSelected: function() {
    return params.selectedSessionIds().length === 1;
  },

  selectedSessionId: function() {
    return params.selectedSessionIds()[0];
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
