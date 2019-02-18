import _ from 'underscore';

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
  heat,
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

    ['sensor', 'location', 'usernames', 'layers', 'heatLegend'].forEach(function(name) {
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
    });

    $scope.minResolution = 10;
    $scope.maxResolution = 50;

    if (!params.get('data').heat) {
      sensors.fetchHeatLevels($scope.onHeatLevelsFetch);
    }

    storage.updateFromDefaults();
  };

  $scope.searchSessions = function() {
    storage.updateWithRefresh('location');
    params.update({'didSessionsSearch': true});
  };

  $scope.$watch("params.get('data').sensorId", function(newValue) { sensors.onSelectedSensorChange(newValue); }, true);

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    console.warn(newValue, oldValue)
    sensors.onSensorsSelectedIdChange(newValue, oldValue, $scope.onHeatLevelsFetch);
  }, true);

  $scope.onHeatLevelsFetch = function(data, status, headers, config) {
    storage.updateDefaults({heat: heat.parse(data)});
    params.update({data: {heat: heat.parse(data)}});
  };

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

  $scope.heatUpdateCondition = function() {
    return {sensorId:  sensors.anySelectedId(), sessionId: $scope.singleSession.id()};
  };

  $scope.$watch("heatUpdateCondition()", function(newValue, oldValue) {
    console.log("watch - heatUpdateCondition() - ", newValue, " - ", oldValue);
    if(newValue.sensorId && newValue.sessionId){
      functionBlocker.use("sessionHeat", function(){
        $scope.singleSession.updateHeat();
      });
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
}
