function TmpSensorDialogCtrl($scope, sensors, params) {
  $scope.sensors = sensors;
  $scope.params = params;
}
TmpSensorDialogCtrl.$inject = ['$scope', 'sensors', 'params'];
