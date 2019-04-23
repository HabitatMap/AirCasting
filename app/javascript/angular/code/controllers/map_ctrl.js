function MapCtrl($scope, map, params) {
  $scope.map = map;
  $scope.params = params;
}
MapCtrl.$inject = ["$scope", "map", "params"];
angular.module("aircasting").controller("MapCtrl", MapCtrl);
