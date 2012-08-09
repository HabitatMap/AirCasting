function SessionsMapCtrl($scope, $http, params, heat, utils, $window, map, sensors, expandables, storage, storageEvents) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.storageEvents = storageEvents;
    $scope.sensors = sensors;
    $scope.expandables = expandables;

    $scope.minTime = 0;
    $scope.maxTime = 24 * 60 - 1;
    $scope.minDay = 1;
    $scope.maxDay = 365;

    _.each(['sensor', 'location', 'usernames'], function(name) {
      $scope.expandables.toggle(name);
    });

    $scope.params.update({
      time:  _($scope.params.getData().time).isEmpty() ? {
        timeFrom : $scope.minTime,
        timeTo : $scope.maxTime,
        dayFrom : $scope.minDay,
        dayTo : $scope.maxDay
      } : $scope.params.getData().time,
      heat:  $scope.params.getData().heat || heat.parse([0,1,2,3,4])
    });
  };

  $scope.setDefaults();

}
SessionsMapCtrl.$inject = ['$scope', '$http', 'params', 'heat',
  'utils', '$window', 'map', 'sensors', 'expandables', 'storage', 'storageEvents'];
