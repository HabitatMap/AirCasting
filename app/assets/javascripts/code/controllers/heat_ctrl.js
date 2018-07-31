function HeatCtrl($scope, sensors, storage, storageEvents, heat ) {
  const singleSession = $scope.singleSession;

  $scope.storage = storage;
  $scope.storageEvents = storageEvents;
  $scope.sensors = sensors;
  $scope.heat = heat;

  $scope.resetHeat = function() {
    if(singleSession && singleSession.get()) {
      singleSession.updateHeat();
    } else {
      storage.reset('heat');
    }
  };
}
HeatCtrl.$inject = ['$scope', 'sensors', 'storage', 'storageEvents', 'heat'];
angular.module('aircasting').controller('HeatCtrl', HeatCtrl);
