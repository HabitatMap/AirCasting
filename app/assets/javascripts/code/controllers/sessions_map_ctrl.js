function SessionsMapCtrl($scope, params, heat, $window, map, sensors, expandables, storage, storageEvents, singleSession) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.storageEvents = storageEvents;
    $scope.sensors = sensors;
    $scope.expandables = expandables;
    $scope.sensorInitializedForSessions = false;
    $scope.sensorInitializedForHeat = false;
    _.each(['sensor', 'location', 'usernames'], function(name) {
      $scope.expandables.show(name);
    });

    var locationParams = $scope.params.get('data').location || {};
    $scope.params.update({data: {
      location: {distance: locationParams.distance || "5", limit: locationParams.limit || false},
      heat:  heat.getValues() || heat.parse([0,1,2,3,4])
    }});
  };

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    if(newValue == oldValue){
      return;
    }
    if($scope.sensorInitializedForSessions){
      var data = heat.toSensoredList(sensors.anySelected());
      $scope.params.update({sessionsIds: [], data: {heat: heat.parse(data) }});
    } else {
      $scope.sensorInitializedForHeat = true;
    }
  }, true);

  $scope.$watch("sensors.tmpSelectedId()", function(newValue, oldValue) {
    if(!newValue){
      return;
    }
    var data = heat.toSensoredList(singleSession.get().streams[sensors.tmpSelected().sensor_name]);
    $scope.params.update({data: {heat: heat.parse(data)}});
  }, true);

  $scope.setDefaults();

}
SessionsMapCtrl.$inject = ['$scope', 'params', 'heat',
  '$window', 'map', 'sensors', 'expandables', 'storage', 'storageEvents', 'singleSession'];
