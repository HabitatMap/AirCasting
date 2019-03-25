import _ from 'underscore';
import { Elm } from '../../../elm/src/FixedSessionFilters.elm';
import moment from 'moment'

import * as FiltersUtils from '../filtersUtils'

export const FixedSessionsMapCtrl = (
  $scope,
  params,
  heat,
  map,
  sensors,
  expandables,
  storage,
  fixedSessions,
  versioner,
  storageEvents,
  singleFixedSession,
  functionBlocker,
  $window,
  $location,
  rectangles,
  infoWindow,
  $http,
  sensorsList
) => {
  sensors.setSensors(sensorsList);

  $scope.setDefaults = function() {
    $scope.versioner = versioner;
    $scope.params = params;
    $scope.storage = storage;
    $scope.storageEvents = storageEvents;
    $scope.sensors = sensors;
    $scope.expandables = expandables;
    $scope.sessions = fixedSessions;
    $scope.singleSession = singleFixedSession;
    $scope.$window = $window;

    functionBlocker.block("sessionHeat", !_(params.get('selectedSessionIds')).isEmpty());

    rectangles.clear();
    infoWindow.hide();
    map.unregisterAll();
    map.removeAllMarkers();

    if (process.env.NODE_ENV !== 'test') {
      $($window).resize(function() {
        $scope.$digest();
      });
    }
    _.each(['sensor', 'location', 'usernames'], function(name) {
      $scope.expandables.show(name);
    });

    const sensorId = params
      .get('data', { sensorId: sensors.defaultSensorId })
      .sensorId;

    const defaults = {
      sensorId,
      location: {address: "", indoorOnly: false, streaming: true},
      tags: "",
      usernames: "",
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
    sensors.onSensorsSelectedIdChange(newValue, oldValue);
  }, true);

  $scope.$watch("params.get('data').heat", function(newValue, oldValue) {
    console.log("watch - params.get('data').heat - ", newValue, " - ", oldValue);
    if (newValue != oldValue) {
      $scope.sessions.drawSessionsInLocation();
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
      const node = document.getElementById('newFixedFilters');

      const timeRange = {
        timeFrom: $scope.params.get('data').timeFrom,
        timeTo: $scope.params.get('data').timeTo,
      };

      const flags = {
        tags: $scope.params.get('data').tags.split(', ').filter((tag) => tag !== "") || [],
        profiles: $scope.params.get('data').usernames.split(', ').filter((tag) => tag !== "") || [],
        timeRange
      };

      const elmApp = Elm.FixedSessionFilters.init({ node: node, flags: flags });

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
  };
};
