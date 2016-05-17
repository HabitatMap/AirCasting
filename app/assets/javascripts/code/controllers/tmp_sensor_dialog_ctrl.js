function TmpSensorDialogCtrl($scope, sensors, params) {
  $scope.sensors = sensors;
  $scope.params = params;

  $scope.availSensors = function() {
    return singleSession.availSensors();
  };
}
TmpSensorDialogCtrl.$inject = ['$scope', 'sensors', 'params'];
