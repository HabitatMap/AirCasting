function FixedSessionsMapCtrl($scope, params, heat, map, sensors, expandables, storage, fixedSessions, versioner,
                         storageEvents, singleFixedSession, functionBlocker, $window, $location, spinner,
                         rectangles, infoWindow, $http) {
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
    $scope.initializing = true;

    functionBlocker.block("selectedId", !!params.get('data').sensorId);
    functionBlocker.block("sessionHeat", !_(params.get('sessionsIds')).isEmpty());

    rectangles.clear();
    infoWindow.hide();
    map.unregisterAll();

    $($window).resize(function() {
      $scope.$digest();
    });
    _.each(['sensor', 'location', 'usernames'], function(name) {
      $scope.expandables.show(name);
    });

    storage.updateDefaults({
      sensorId: "",
      location: {address: "", distance: "10", limit: true, outdoorOnly: true, streaming: true},
      tags: "",
      usernames: ""
    });

    storage.updateFromDefaults();

    sensors.shouldInitSelected = true;
    sensors.initSelected();
  };

  $scope.searchSessions = function() {
    storage.updateWithRefresh('location');
    params.update({'didSessionsSearch': true});
  };

  //fix for json null parsing
  $scope.$watch("params.get('data').sensorId", function(newValue) {
    if(_(newValue).isNull()){
      params.update({data: {sensorId: ""}});
    }
  }, true);

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    if(newValue == oldValue || !newValue){
      return;
    }

    var sensor = sensors.findSensorById(newValue);
    var parameterForSensor = sensors.findParameterForSensor(sensor);
    sensors.selectedParameter = parameterForSensor;

    params.update({data: {sensorId: newValue}});
    spinner.show();
    $http.get('/api/thresholds/' + sensors.selected().sensor_name,
      {params: {unit_symbol: sensors.selected().unit_symbol}, cache: true}).success($scope.onThresholdsFetch);
    functionBlocker.use("selectedId", function(){
      params.update({sessionsIds: []});
    });
  }, true);

  $scope.onThresholdsFetch = function(data, status, headers, config) {
    storage.updateDefaults({heat: heat.parse(data)});
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
    spinner.hide();
  };

  $scope.$watch("params.get('data').heat", function(newValue, oldValue) {
    if (newValue != oldValue) {
      $scope.sessions.drawSessionsInLocation();
    }
  }, true);
  $scope.$watch("sensors.selectedParameter", function(newValue, oldValue) {
    if (newValue) {
      sensors.availableSensors = _(sensors.sensors).filter(function(sensor) { return sensor["measurement_type"] == newValue["id"]})
    } else {
      sensors.availableSensors = sensors.sensors
    }
  }, true)

  $scope.heatUpdateCondition = function() {
    return {sensorId: sensors.anySelectedId(), sessionId: $scope.singleSession.id()};
  };
  $scope.$watch("heatUpdateCondition()", function(newValue, oldValue) {
    if(newValue.sensorId && newValue.sessionId && !$scope.initializing){
      functionBlocker.use("sessionHeat", function(){
        $scope.singleSession.updateHeat();
      });
    }
   }, true);

  $scope.setDefaults();
}
FixedSessionsMapCtrl.$inject = ['$scope', 'params', 'heat',
  'map', 'sensors', 'expandables', 'storage', 'fixedSessions', 'versioner',
  'storageEvents', 'singleFixedSession', 'functionBlocker', '$window', '$location', 'spinner',
  'rectangles', 'infoWindow', '$http'];
