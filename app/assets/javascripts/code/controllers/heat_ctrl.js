function HeatCtrl($scope, sensors, storage, storageEvents, heat ) {
  $scope.storage = storage;
  $scope.storageEvents = storageEvents;
  $scope.sensors = sensors;
  $scope.heat = heat;
}
HeatCtrl.$inject = ['$scope', 'sensors', 'storage', 'storageEvents', 'heat'];
