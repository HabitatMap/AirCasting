function UsernamesAndTagsFiltersCtrl($scope, expandables, storage, storageEvents) {
  $scope.storage = storage;
  $scope.storageEvents = storageEvents;
  $scope.expandables = expandables;
}
UsernamesAndTagsFiltersCtrl.$inject = ['$scope', 'expandables', 'storage', 'storageEvents'];
