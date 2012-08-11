function SessionsGraphCtrl($scope, $http, params, map, sensors, storage) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.sensors = sensors;
  };

  $scope.setDefaults();

}
SessionsGraphCtrl.$inject = ['$scope', '$http', 'params', 'map', 'sensors', 'storage'];
