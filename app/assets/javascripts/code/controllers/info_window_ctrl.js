function InfoWindowCtrl($scope, sensors, infoWindow ) {
  $scope.sensors = sensors;
  $scope.infoWindow = infoWindow;
}
InfoWindowCtrl.$inject = ['$scope', 'sensors', 'infoWindow'];
