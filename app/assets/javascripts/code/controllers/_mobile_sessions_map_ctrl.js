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
  heat
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
    $scope.initializing = true;

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

    ['sensor', 'location', 'usernames', 'layers'].forEach(function(name) {
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

    storage.updateFromDefaults();
  };

  $scope.searchSessions = function() {
    storage.updateWithRefresh('location');
    params.update({'didSessionsSearch': true});
  };

  $scope.$watch("params.get('data').sensorId", function(newValue) { sensors.onSelectedSensorChange(newValue); }, true);

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    sensors.onSensorsSelectedIdChange(newValue, oldValue, $scope.onThresholdsFetch);
  }, true);

  $scope.onThresholdsFetch = function(data, status, headers, config) {
    storage.updateDefaults({heat: heat.parse(data)});
    // seems like there's no call to block so this function blocker is prolly not needed
    functionBlocker.use("heat", function(){
      if (!params.get('data').heat && $scope.initializing) {
        params.update({data: {heat: heat.parse(data)}});
        $scope.initializing = false;
      } else if (params.get('data').heat && !$scope.initializing){
        params.update({data: {heat: heat.parse(data)}});
      } else {
        $scope.initializing = false;
      }
    });
  };

  $scope.$watch("params.get('data').heat", function(newValue, oldValue) {
    console.log("watch - params.get('data').heat - ", newValue, " - ", oldValue);
    if (newValue != oldValue) {
      $scope.sessions.drawSessionsInLocation();
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
