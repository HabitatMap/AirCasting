function TmpSensorDialogCtrl($scope, sensors, params) {
  $scope.sensors = sensors;
  $scope.params = params;

  $scope.availSensors = function() {
    return window.singleSession ? window.singleSession.availSensors() : [];
  };
}
TmpSensorDialogCtrl.$inject = ['$scope', 'sensors', 'params'];
angular.module('aircasting').controller('TmpSensorDialogCtrl', TmpSensorDialogCtrl);
