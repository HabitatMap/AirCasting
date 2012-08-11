function TimeFiltersCtrl($scope, params, expandables, storage, storageEvents) {
  $scope.params = params;
  $scope.storage = storage;
  $scope.storageEvents = storageEvents;
  $scope.expandables = expandables;

  $scope.minTime = 0;
  $scope.maxTime = 24 * 60 - 1;
  $scope.minDay = 1;
  $scope.maxDay = 365;

  $scope.params.update('data', {
    time:  _($scope.params.get('data').time).isEmpty() ? {
      timeFrom : $scope.minTime,
      timeTo : $scope.maxTime,
      dayFrom : $scope.minDay,
      dayTo : $scope.maxDay
    } : $scope.params.get('data').time
  });

}
TimeFiltersCtrl.$inject = ['$scope', 'params',  'expandables', 'storage', 'storageEvents'];
