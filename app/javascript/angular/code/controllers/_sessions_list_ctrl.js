import _ from "underscore";
import { formatSessionForList } from "../values/session";

export const SessionsListCtrl = (
  $scope,
  params,
  sensors,
  storage,
  flash,
  $window,
  drawSession,
  markerSelected,
  updateCrowdMapLayer
) => {
  let sessions;
  const elmApp = $window.__elmApp;
  const CANNOT_SELECT_MULTIPLE_SESSIONS = "You can't select multiple sessions";

  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.$window = $window;
    $scope.sensors = sensors;
    $scope.markerSelected = markerSelected;
    $window.sessions = sessions = $scope.sessions;
    $scope.sessionsForList = [];
    $scope.firstLoad = true;

    // prolly this can be removed
    if (_(params.get("selectedSessionIds", [])).isEmpty()) {
      params.update({ selectedSessionIds: [] });
    }

    sessions.reSelectAllSessions();
  };

  $scope.isSessionDisabled = function(sessionId) {
    // disabled if there is another selected session and it is not the selected session
    // when refactoring to a radio button this should always be false
    return (
      !params.get("selectedSessionIds", []).includes(sessionId) &&
      sessions.hasSelectedSessions()
    );
  };

  $scope.$watch(
    "params.get('map')",
    ({ hasChangedProgrammatically }) => {
      console.log("watch - params.get('map')");
      if (sessions.hasSelectedSessions()) return;
      if ($scope.firstLoad || hasChangedProgrammatically) {
        sessions.fetch({ amount: params.get("fetchedSessionsCount") });
      } else {
        sessions.fetch();
      }
      $scope.firstLoad = false;
    },
    true
  );

  $scope.canSelectSession = function(sessionId) {
    const session = sessions.find(sessionId);
    if (sessions.hasSelectedSessions()) {
      flash.set(CANNOT_SELECT_MULTIPLE_SESSIONS);
      return false;
    } else {
      return true;
    }
  };

  $scope.newSessionsForList = function() {
    return $scope.sessions.get().map(formatSessionForList);
  };

  $scope.$watch(
    "newSessionsForList()",
    function(newSessions, oldSessions) {
      console.log("newSessionsForList()", newSessions, oldSessions);
      $scope.sessionsForList = newSessions;
      elmApp.ports.updateSessions.send({
        fetched: newSessions.map(formatSessionForElm),
        fetchableSessionsCount: $scope.sessions.fetchableSessionsCount
      });
    },
    true
  );

  $scope.$on("markerSelected", function(event, data) {
    $scope.toggleSession(
      data.session_id,
      elmApp.ports.toggleSessionSelection.send
    );
    $scope.$apply();
  });

  $scope.toggleSession = function(sessionId, callback) {
    if (this.isSessionDisabled(sessionId)) {
      flash.set(CANNOT_SELECT_MULTIPLE_SESSIONS);
      return;
    }
    var session = sessions.find(sessionId);
    if (sessions.isSelected(session)) {
      params.update({ selectedSessionIds: [] });
      callback(null);
    } else if ($scope.canSelectSession(sessionId)) {
      params.update({ selectedSessionIds: [sessionId] });
      $scope.markerSelected.set(true);
      callback(sessionId);
    }
  };

  $scope.$watch(
    "params.get('selectedSessionIds')",
    function(newIds, oldIds) {
      console.log("watch - params.get('selectedSessionIds')");
      sessions.sessionsChanged(newIds, oldIds);
    },
    true
  );

  $scope.setDefaults();

  if (process.env.NODE_ENV !== "test") {
    angular.element(document).ready(() => {
      elmApp.ports.toggleSession.subscribe(({ selected, deselected }) => {
        if (deselected) $scope.toggleSession(deselected, () => {});
        if (selected) $scope.toggleSession(selected, () => {});
        $scope.$apply();
      });

      elmApp.ports.loadMoreSessions.subscribe(() => {
        sessions.fetch({
          fetchedSessionsCount: sessions.sessions.length
        });
      });

      elmApp.ports.updateHeatMapThresholds.subscribe(
        ({ threshold1, threshold2, threshold3, threshold4, threshold5 }) => {
          const heat = {
            lowest: threshold1,
            low: threshold2,
            mid: threshold3,
            high: threshold4,
            highest: threshold5
          };
          params.update({ data: { heat } });
          $scope.$apply();
        }
      );
    });
  }
};

const formatSessionForElm = s => ({
  ...s,
  shortTypes: s.shortTypes.map(({ name, type }) => ({ name, type_: type }))
});
