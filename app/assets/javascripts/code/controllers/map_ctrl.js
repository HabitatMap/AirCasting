function MapCtrl($scope, map, params) {
  $scope.map = map;
  $scope.params = params;
}
MapCtrl.$inject = ['$scope', 'map', 'params'];
