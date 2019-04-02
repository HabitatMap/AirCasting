import _ from 'underscore';
import { Elm } from '../../../elm/src/MobileSessionsFilters.elm';
import moment from 'moment'
import * as FiltersUtils from '../filtersUtils'
import { buildAvailableParameters } from '../services/_sensors'

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

    ['sensor', 'heatLegend'].forEach(function(name) {
      $scope.expandables.show(name);
    });

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

  $scope.$watch("params.get('data').sensorId", function(newValue) { sensors.onSelectedSensorChange(newValue); }, true);

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    console.warn(newValue, oldValue)
    sensors.onSensorsSelectedIdChange(newValue, oldValue);
  }, true);

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

  // two places in _sensors.js still use that watch
  $scope.$watch("sensors.selectedParameter", function(newValue, oldValue) {
    sensors.onSelectedParameterChange(newValue, oldValue);
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
        parametersList: buildAvailableParameters(sensorsList),
        selectedParameter: sensors.findParameterForSensor(sensors.selected()).id,
        isCrowdMapOn: $scope.params.get('data').crowdMap || false,
        crowdMapResolution: $scope.params.get('data').gridResolution || 25,
        location: $scope.params.get('data').location || "",
        tags: $scope.params.get('data').tags.split(', ').filter((tag) => tag !== "") || [],
        profiles: $scope.params.get('data').usernames.split(', ').filter((tag) => tag !== "") || [],
        timeRange
      };

      const elmApp = Elm.MobileSessionsFilters.init({ node: node, flags: flags });

      elmApp.ports.selectParameter.subscribe(parameter =>{
        const oldValue = sensors.selectedParameter;
        const newParameter = { label: parameter, id: parameter };

        $scope.sensors.selectedParameter = newParameter
        sensors.onSelectedParameterChange(newParameter, oldValue);
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
        , "profiles-search"
        , "/autocomplete/usernames"
      )

      FiltersUtils.setupAutocomplete(
        (selectedValue) => elmApp.ports.tagSelected.send(selectedValue)
        , "tags-search"
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
