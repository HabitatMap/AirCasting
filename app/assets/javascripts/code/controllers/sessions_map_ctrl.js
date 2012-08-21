function SessionsMapCtrl($scope, params, heat, map, sensors, expandables, storage,
                         storageEvents, singleSession, functionBlocker) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.storageEvents = storageEvents;
    $scope.sensors = sensors;
    $scope.expandables = expandables;
    $scope.singleSession = singleSession;

    functionBlocker.block("selectedId", !!params.get('data').selectedId);
    functionBlocker.block("sessionHeat", !!params.get('tmpSessionId') && !_(params.get('sessionsIds')).isEmpty());

    _.each(['sensor', 'location', 'usernames'], function(name) {
      $scope.expandables.show(name);
    });

    storage.updateDefaults({
      location: {distance: "5", limit: false},
      gridResolution : 25
    });

    storage.updateFromDefaults();
  };

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    if(newValue == oldValue){
      return;
    }
    functionBlocker.use("selectedId", function(){
      params.update({sessionsIds: []});
    });
  }, true);

  $scope.heatUpdateCondition = function() {
    return {sensorId:  sensors.anySelectedId(), sessionId: singleSession.id()};
  };
  $scope.$watch("heatUpdateCondition()", function(newValue, oldValue) {
    if(newValue.sensorId && newValue.sessionId){
      functionBlocker.use("sessionHeat", function(){
        singleSession.updateHeat();
      });
    }
   }, true);


  $scope.setDefaults();

}
SessionsMapCtrl.$inject = ['$scope', 'params', 'heat',
   'map', 'sensors', 'expandables', 'storage',
  'storageEvents', 'singleSession', 'functionBlocker'];
