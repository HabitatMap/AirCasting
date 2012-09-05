function HudCtrl($scope, map, spinner, versioner) {
  $scope.map = map;
  $scope.spinner = spinner;
  $scope.versioner = versioner;

  $scope.onZoom = function(event, ui) {
    map.setZoom(ui.value);
  };

  $scope.zoomStep = function(step) {
    map.setZoom(map.getZoom() + step);
  };

}
HudCtrl.$inject = ['$scope', 'map', 'spinner', 'versioner'];
