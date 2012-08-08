function HudCtrl($scope, map) {
  $scope.map = map;

  $scope.onZoom = function(event, ui) {
    map.setZoom(ui.value);
  };

  $scope.zoomStep = function(step) {
    map.setZoom(map.getZoom() + step);
  };

}
HudCtrl.$inject = ['$scope', 'map'];
