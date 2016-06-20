function HeatCtrl($scope, sensors, storage, storageEvents, heat ) {
  singleSession = $scope.singleSession;

  $scope.storage = storage;
  $scope.storageEvents = storageEvents;
  $scope.sensors = sensors;
  $scope.heat = heat;

  $scope.resetHeat = function() {
    if(singleSession.get()) {
      singleSession.updateHeat();
    } else {
      storage.reset('heat');
    }
  };
}
HeatCtrl.$inject = ['$scope', 'sensors', 'storage', 'storageEvents', 'heat'];
