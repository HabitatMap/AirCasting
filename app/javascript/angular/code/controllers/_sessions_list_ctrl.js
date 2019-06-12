import _ from "underscore";
import { formatSessionForList } from "../../../javascript/values/session";

export const SessionsListCtrl = (
  $scope,
  params,
  sensors,
  $window,
  drawSession,
  markerSelected,
  sessionsUtils,
  map
) => {
  let sessions;
  let pulsatingSessionMarker = null;
  const elmApp = $window.__elmApp;

  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.$window = $window;
    $scope.sensors = sensors;
    $scope.markerSelected = markerSelected;
    $window.sessions = sessions = $scope.sessions;
    $scope.sessionsForList = [];

    if (sessionsUtils.isSessionSelected())
      sessions.reSelectSession(sessionsUtils.selectedSessionId());
  };

  $scope.$watch(
    "params.get('map')",
    (newValue, oldValue) => {
      console.log("watch - params.get('map')");
      if (newValue === oldValue) return; // on angular $watch init
      if (sessionsUtils.isSessionSelected()) return;
      // when loading the page for the first time sometimes the watch is triggered twice, first time with hasChangedProgrammatically as undefined
      if (newValue.hasChangedProgrammatically === undefined) return;

      if (newValue.hasChangedProgrammatically) {
        //triggered when deselecting a session
        sessions.fetch({ amount: params.paramsData["fetchedSessionsCount"] });
        return;
      }

      if (!params.get("data").isSearchAsIMoveOn) {
        sessionsUtils.refreshMapView(sessions);
        if (!newValue.hasChangedProgrammatically)
          elmApp.ports.mapMoved.send(null);
        return;
      }

      sessions.fetch();
    },
    true
  );

  $scope.newSessionsForList = function() {
    return $scope.sessions
      .get()
      .map(selectedStream(sensors.selectedSensorName()))
      .map(formatSessionForList);
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

  $scope.$on("googleMapsReady", function() {
    if (sessionsUtils.isSessionSelected()) return;
    sessions.fetch({
      amount: params.paramsData["fetchedSessionsCount"]
    });
  });

  $scope.$on("markerSelected", function(event, data) {
    $scope.toggleSession(
      data.session_id,
      elmApp.ports.toggleSessionSelection.send
    );
    $scope.$apply();
  });

  $scope.toggleSession = function(sessionId, callback) {
    if (sessionsUtils.selectedSessionId() === sessionId) {
      sessions.deselectSession();
      callback(null);
    } else {
      sessions.selectSession(sessionId);
      $scope.markerSelected.set(true);
      callback(sessionId);
    }
  };

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

      elmApp.ports.toggleIsSearchOn.subscribe(isSearchAsIMoveOn => {
        params.update({ data: { isSearchAsIMoveOn: isSearchAsIMoveOn } });
        $scope.$apply();
      });

      elmApp.ports.fetchSessions.subscribe(() => {
        sessions.fetch();
      });

      elmApp.ports.pulseSessionMarker.subscribe(location => {
        if (location === null) {
          pulsatingSessionMarker.setMap(null);
          return;
        }

        pulsatingSessionMarker = map.drawPulsatingMarker(location);
      });
    });
  }
};

const selectedStream = sensorName => session => ({
  ...session,
  selectedStream: session.streams[sensorName]
});

const formatSessionForElm = s => ({
  ...s,
  shortTypes: s.shortTypes.map(({ name, type }) => ({ name, type_: type })),
  average: nullOrValue(s.average)
});

const nullOrValue = value => {
  if (value === undefined) {
    return null;
  } else {
    return value;
  }
};
