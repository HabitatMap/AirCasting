function SessionsMapCtrl($scope, $http, params, heat, $window, map, sensors, expandables, storage, storageEvents) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.storageEvents = storageEvents;
    $scope.sensors = sensors;
    $scope.expandables = expandables;

    _.each(['sensor', 'location', 'usernames'], function(name) {
      $scope.expandables.show(name);
    });

    $scope.params.update({data: {
      location: {distance: "5"},
      heat:  $scope.params.get('data').heat || heat.parse([0,1,2,3,4])
    }});
  };

  $scope.setDefaults();

}
SessionsMapCtrl.$inject = ['$scope', '$http', 'params', 'heat',
  '$window', 'map', 'sensors', 'expandables', 'storage', 'storageEvents'];
