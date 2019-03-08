import _ from 'underscore';
import { Elm } from '../../../elm/src/MobileSessionsFilters.elm';
import moment from 'moment'

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

    storage.updateDefaults({
      sensorId,
      location: {address: ""},
      tags: "",
      usernames: "",
      gridResolution: 25,
      crowdMap: false,
      timeFrom: moment().utc().startOf('day').subtract(1, 'year').format('X'),
      timeTo: moment().utc().endOf('day').format('X')
    });

    if (!params.get('data').heat) sensors.fetchHeatLevels();

    storage.updateFromDefaults();
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
        timeRange: timeRange
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

      setAutocomplete(
        (selectedValue) => elmApp.ports.profileNameSelected.send(selectedValue)
        , "profiles-search"
        , "/autocomplete/usernames"
      )

      setAutocomplete(
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

      setTimeRangeFilter(params, elmApp, $scope.sessions)
    });
  }
}

const setTimeRangeFilter = (params, elmApp, sessions) => {
  if (document.getElementById("daterange")) {
    $('input[id="daterange"]').daterangepicker({
      opens: 'left',
      timePicker: true,
      startDate: moment.unix((params.get('data').timeFrom)).utc().format('DD/MM/YYYY hh:mm A'),
      endDate: moment.unix((params.get('data').timeTo)).utc().format('DD/MM/YYYY hh:mm A'),
      locale: {
        format: 'DD/MM/YYYY hh:mm A'
      }
    }, function(timeFrom, timeTo, _) {
      timeFrom = timeFrom.utcOffset(0, true).unix(),
      timeTo = timeTo.utcOffset(0, true).unix()

      elmApp.ports.timeRangeSelected.send({
        timeFrom: timeFrom,
        timeTo: timeTo
      })

      params.update({ data: {
        timeFrom: timeFrom,
        timeTo: timeTo
      }});

      sessions.fetch();
    });
  } else {
    window.setTimeout(setTimeRangeFilter(params, elmApp, sessions), 100);
  }
}

const setAutocomplete = (callback, id, path) => {
  if (document.getElementById(id)) {
    $( "#" + id )
      .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.ENTER ) {
          $( this ).data( "autocomplete" ).close(event);
        }
      })
      .autocomplete({
      source: function( request, response ) {
        const data = {q: request.term, limit: 10};
        $.getJSON( path, data, response );
      },
      select: function( event, ui) {
        callback(ui.item.value);
      }
    });
  } else {
    window.setTimeout(setAutocomplete(callback, id, path), 100);
  };
}
