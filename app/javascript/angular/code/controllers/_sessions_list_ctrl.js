import _ from "underscore";
import { formatSessionForList } from "../../../javascript/values/session";

export const SessionsListCtrl = (
  $scope,
  params,
  $window,
  sessionsUtils,
  map
) => {
  let sessions;
  let pulsatingSessionMarker = null;
  const elmApp = $window.__elmApp;

  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.$window = $window;
    $window.sessions = sessions = $scope.sessions;

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

      elmApp.ports.pulseSessionMarker.subscribe(sessionMarkerData => {
        if (sessionMarkerData === null) {
          pulsatingSessionMarker.setMap(null);
          return;
        }

        if (window.__map.clusterers[0]) {
          const cluster = window.__map.clusterers[0].clusters_.find(cluster =>
            cluster.markers_.some(
              marker => marker.objectId() === sessionMarkerData.id
            )
          );

          if (cluster) {
            pulsatingSessionMarker = map.drawPulsatingMarker(
              cluster.center_,
              sessionMarkerData.heatLevel
            );
            return;
          }
        }

        window.__map.customMarkers.forEach(marker => {
          if (marker.objectId() === sessionMarkerData.id) {
            marker.moveOnTop();
            return;
          }
        });

        pulsatingSessionMarker = map.drawPulsatingMarker(
          sessionMarkerData.location,
          sessionMarkerData.heatLevel
        );
      });

      elmApp.ports.saveScrollPosition.subscribe(value => {
        params.update({ scroll: value });
        $scope.$apply();
      });
    });
  }
};
