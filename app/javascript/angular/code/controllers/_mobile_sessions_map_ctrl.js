import _ from 'underscore';
import moment from 'moment'
import * as FiltersUtils from '../filtersUtils'

export const MobileSessionsMapCtrl = (
  $scope,
  params,
  map,
  sensors,
  storage,
  mobileSessions,
  versioner,
  singleMobileSession,
  functionBlocker,
  $window,
  infoWindow,
  sessionsUtils
) => {
  sensors.setSensors($window.__sensors);

  $scope.setDefaults = function() {
    $scope.versioner = versioner;
    $scope.params = params;
    $scope.storage = storage;
    $scope.sensors = sensors;
    $scope.sessions = mobileSessions;
    $scope.singleSession = singleMobileSession;
    $scope.$window = $window;

    functionBlocker.block("sessionHeat", !_(params.get('selectedSessionIds')).isEmpty());

    map.clearRectangles();
    infoWindow.hide();
    map.unregisterAll();
    map.removeAllMarkers();

    if (process.env.NODE_ENV !== 'test') {
      $($window).resize(function() {
        $scope.$digest();
      });
    }

    const sensorId = params
      .get('data', { sensorId: sensors.defaultSensorId })
      .sensorId;

    const defaults = {
      sensorId,
      location: "",
      tags: "",
      usernames: "",
      gridResolution: 25,
      crowdMap: false,
      timeFrom: moment().utc().startOf('day').subtract(1, 'year').format('X'),
      timeTo: moment().utc().endOf('day').format('X')
    };

    if (!params.get('data').heat) sensors.fetchHeatLevels();

    params.updateFromDefaults(defaults);
  };

  $scope.$watch("params.get('data').heat", function(newValue, oldValue) {
    console.log("watch - params.get('data').heat - ", newValue, " - ", oldValue);
    if (newValue === oldValue) return;

    if ($scope.params.isCrowdMapOn() && mobileSessions.noOfSelectedSessions() === 0) {
      sessionsUtils.updateCrowdMapLayer(mobileSessions.sessionIds());
    } else if ($scope.params.isCrowdMapOn() && mobileSessions.noOfSelectedSessions() === 1) {
      sessionsUtils.updateCrowdMapLayer($scope.params.get('selectedSessionIds'));
      mobileSessions.redrawSelectedSession($scope.params.get('selectedSessionIds')[0]);
    } else if (mobileSessions.noOfSelectedSessions() === 1) {
      mobileSessions.redrawSelectedSession($scope.params.get('selectedSessionIds')[0]);
    } else if (mobileSessions.noOfSelectedSessions() === 0) {
      $scope.sessions.drawSessionsInLocation();
    } else {
      console.warn("mobileSessions.noOfSelectedSessions() should be 0 or 1 and is: ", mobileSessions.noOfSelectedSessions())
    }
  }, true);

  $scope.setDefaults();

  if (process.env.NODE_ENV !== 'test') {
    angular.element(document).ready(function () {
      const elmApp = window.__elmApp;

      elmApp.ports.selectSensorId.subscribe(sensorId =>{
        params.update({ selectedSessionIds: [] });
        params.update({ data: { sensorId }});
        $scope.sessions.fetch();
      });

      elmApp.ports.toggleCrowdMap.subscribe(crowdMap => {
        params.updateData({ crowdMap });
        $scope.sessions.fetch();
      });

      elmApp.ports.updateResolution.subscribe(gridResolution => {
        params.updateData({ gridResolution });
        sessionsUtils.updateCrowdMapLayer($scope.sessions.allSessionIds());
      });

      elmApp.ports.findLocation.subscribe(location => {
        FiltersUtils.findLocation(location, params, map);
      });

      map.onPanOrZoom(() => {
        FiltersUtils.clearLocation(elmApp.ports.locationCleared, params);
      });

      FiltersUtils.setupAutocomplete(
        (selectedValue) => elmApp.ports.profileSelected.send(selectedValue)
        , "profile-names"
        , "/autocomplete/usernames"
      )

      FiltersUtils.setupAutocomplete(
        (selectedValue) => elmApp.ports.tagSelected.send(selectedValue)
        , "tags"
        , "/autocomplete/tags"
      )

      elmApp.ports.updateTags.subscribe(tags => {
        params.update({data: {tags: tags.join(", ")}});
        $scope.sessions.fetch();
      });

      elmApp.ports.updateProfiles.subscribe(profiles => {
        params.update({data: {usernames: profiles.join(", ")}});
        $scope.sessions.fetch();
      });
      const callback = (timeFrom, timeTo) => {
        params.update({ data: {
          timeFrom: timeFrom,
          timeTo: timeTo
        }});

        sessions.fetch();
      }

      FiltersUtils.setupTimeRangeFilter(elmApp, $scope.sessions, callback,  params.get('data').timeFrom, params.get('data').timeTo);

      FiltersUtils.setupClipboard();

      const tooltip = FiltersUtils.tooltipInstance()

      elmApp.ports.showCopyLinkTooltip.subscribe(() => {
        const currentUrl = encodeURIComponent(window.location.href);

        FiltersUtils.fetchShortUrl(currentUrl, tooltip);
      });
    });
  }
}
