function TmpSensorDialogCtrl($scope, sensors, params, singleSession) {
  $scope.sensors = sensors;
  $scope.params = params;
  $scope.singleSession = singleSession;
}
TmpSensorDialogCtrl.$inject = ['$scope', 'sensors', 'params', 'singleSession'];
