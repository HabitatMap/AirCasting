function TimeFiltersCtrl($scope, params, expandables, storage, storageEvents) {
  $scope.params = params;
  $scope.storage = storage;
  $scope.storageEvents = storageEvents;
  $scope.expandables = expandables;

  $scope.minTime = 0;
  $scope.maxTime = 24 * 60 - 1;
  $scope.minDay = 0; //0 days from 1,1,2011
  $scope.maxDay = parseInt(moment(new Date()).format("DDD"), 10);
  $scope.minYear = 2011;
  $scope.maxYear = parseInt(moment(new Date()).format("YYYY"), 10);
  storage.updateDefaults({time: {
      timeFrom : $scope.minTime,
      timeTo : $scope.maxTime,
      dayFrom : $scope.minDay,
      dayTo : $scope.maxDay,
      yearFrom : $scope.minYear,
      yearTo : $scope.maxYear
    }});
  if(_(params.get('data').time).isEmpty()){
    storage.reset("time");
  }
}
TimeFiltersCtrl.$inject = ['$scope', 'params',  'expandables', 'storage', 'storageEvents'];
