function HudCtrl($scope, map, spinner) {
  $scope.map = map;
  $scope.spinner = spinner;

  $scope.onZoom = function(event, ui) {
    map.setZoom(ui.value);
  };

  $scope.zoomStep = function(step) {
    map.setZoom(map.getZoom() + step);
  };

}
HudCtrl.$inject = ['$scope', 'map', 'spinner'];
