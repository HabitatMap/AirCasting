function TimeFiltersCtrl($scope, params, expandables, storage, storageEvents, utils) {
  $scope.params = params;
  $scope.storage = storage;
  $scope.storageEvents = storageEvents;
  $scope.expandables = expandables;
  $scope.utils = utils;

  $scope.minTime = 0;
  $scope.maxTime = 24 * 60 - 1;
  $scope.minDay = 0;
  $scope.maxDay = 365;
  $scope.minYear = 2011;
  $scope.maxYear = parseInt(moment(new Date()).format("YYYY"), 10);
  storage.updateDefaults({time: {
      timeFrom : $scope.minTime  + utils.timeOffset,
      timeTo : $scope.maxTime  + utils.timeOffset,
      dayFrom : $scope.minDay,
      dayTo : $scope.maxDay,
      yearFrom : $scope.minYear,
      yearTo : $scope.maxYear
    }});
  if(_(params.get('data').time).isEmpty()){
    storage.reset("time");
  }
}
TimeFiltersCtrl.$inject = ['$scope', 'params',  'expandables', 'storage', 'storageEvents', 'utils'];
