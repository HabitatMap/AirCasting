function MapCtrl($scope, map) {
  $scope.map = map;
}
MapCtrl.$inject = ["$scope", "map"];
angular.module("aircasting").controller("MapCtrl", MapCtrl);
