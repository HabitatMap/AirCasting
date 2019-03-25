import _ from 'underscore';
import { Elm } from '../../../elm/src/MobileSessionsFilters.elm';
import moment from 'moment'
import * as FiltersUtils from '../filtersUtils'

export const MobileSessionsMapCtrl = (
  $scope,
  params,
  map,
  sensors,
  expandables,
  storage,
  mobileSessions,
  versioner,
  storageEvents,
  singleMobileSession,
  functionBlocker,
  $window,
  infoWindow,
  sensorsList,
  sessionsUtils
) => {
  sensors.setSensors(sensorsList);

  $scope.setDefaults = function() {
    $scope.versioner = versioner;
    $scope.params = params;
    $scope.storage = storage;
    $scope.storageEvents = storageEvents;
    $scope.sensors = sensors;
    $scope.expandables = expandables;
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

    ['sensor', 'location', 'heatLegend'].forEach(function(name) {
      $scope.expandables.show(name);
    });

    const sensorId = params
      .get('data', { sensorId: sensors.defaultSensorId })
      .sensorId;

    const defaults = {
      sensorId,
      location: {address: ""},
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

  $scope.searchSessions = function() {
    storage.updateWithRefresh('location');
    params.update({'didSessionsSearch': true});
  };

  $scope.$watch("params.get('data').sensorId", function(newValue) { sensors.onSelectedSensorChange(newValue); }, true);

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    console.warn(newValue, oldValue)
    sensors.onSensorsSelectedIdChange(newValue, oldValue);
  }, true);

  $scope.$watch("params.get('data').heat", function(newValue, oldValue) {
    console.log("watch - params.get('data').heat - ", newValue, " - ", oldValue);
    if (newValue === oldValue) return;

    if (storage.isCrowdMapLayerOn() && mobileSessions.noOfSelectedSessions() === 0) {
      sessionsUtils.updateCrowdMapLayer(mobileSessions.sessionIds());
    } else if (storage.isCrowdMapLayerOn() && mobileSessions.noOfSelectedSessions() === 1) {
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

  $scope.$watch("sensors.selectedParameter", function(newValue, oldValue) {
    sensors.onSelectedParameterChange(newValue, oldValue);
  }, true);

  $scope.$watch("{location: params.get('data').location.address, counter: params.get('data').counter}",
    function(newValue) {
      console.log("watch - {location: params.get('data').location.address, counter: params.get('data').counter}");
      map.goToAddress(newValue.location);
    }, true);

  $scope.setDefaults();

  if (process.env.NODE_ENV !== 'test') {
    angular.element(document).ready(function () {
      const node = document.getElementById('newMobileFilters');

      const timeRange = {
        timeFrom: $scope.params.get('data').timeFrom,
        timeTo: $scope.params.get('data').timeTo,
      };

      const flags = {
        isCrowdMapOn: $scope.params.get('data').crowdMap || false,
        crowdMapResolution: $scope.params.get('data').gridResolution || 25,
        tags: $scope.params.get('data').tags.split(', ').filter((tag) => tag !== "") || [],
        profiles: $scope.params.get('data').usernames.split(', ').filter((tag) => tag !== "") || [],
        timeRange
      };

      const elmApp = Elm.MobileSessionsFilters.init({ node: node, flags: flags });

      elmApp.ports.toggleCrowdMap.subscribe(() => {
        storage.toggleCrowdMapData();
        $scope.sessions.fetch();
      });

      elmApp.ports.updateResolution.subscribe((newResolution) => {
        storage.updateCrowdMapResolution(newResolution);
        sessionsUtils.updateCrowdMapLayer($scope.sessions.allSessionIds());
      });

      FiltersUtils.setupAutocomplete(
        (selectedValue) => elmApp.ports.profileSelected.send(selectedValue)
        , "profiles-search"
        , "/autocomplete/usernames"
      )

      FiltersUtils.setupAutocomplete(
        (selectedValue) => elmApp.ports.tagSelected.send(selectedValue)
        , "tags-search"
        , "/autocomplete/tags"
      )

      elmApp.ports.updateTags.subscribe((tags) => {
        params.update({data: {tags: tags.join(", ")}});
        $scope.sessions.fetch();
      });

      elmApp.ports.updateProfiles.subscribe((profiles) => {
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
