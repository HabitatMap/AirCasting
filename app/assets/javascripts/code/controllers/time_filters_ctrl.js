function TimeFiltersCtrl($scope, params, expandables, storage, storageEvents) {
  $scope.params = params;
  $scope.storage = storage;
  $scope.storageEvents = storageEvents;
  $scope.expandables = expandables;

  $scope.minTime = 0;
  $scope.maxTime = 24 * 60 - 1;
  $scope.minDay = 0; //0 days from 1,1,2011
  $scope.maxDay = Math.ceil(moment.duration(moment(new Date()) - moment(new Date(2011, 0, 1))).asDays());
  storage.updateDefaults({time: {
      timeFrom : $scope.minTime,
      timeTo : $scope.maxTime,
      dayFrom : $scope.minDay,
      dayTo : $scope.maxDay
    }});
  if(_(params.get('data').time).isEmpty()){
    storage.reset("time");
  }
}
TimeFiltersCtrl.$inject = ['$scope', 'params',  'expandables', 'storage', 'storageEvents'];
