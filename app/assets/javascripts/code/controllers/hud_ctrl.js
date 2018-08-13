function HudCtrl($scope, map, versioner) {
  $scope.map = map;
  $scope.versioner = versioner;

  $scope.onZoom = function(event, ui) {
    map.setZoom(ui.value);
  };

  $scope.zoomStep = function(step) {
    map.setZoom(map.getZoom() + step);
  };

}
HudCtrl.$inject = ['$scope', 'map', 'versioner'];
angular.module('aircasting').controller('HudCtrl', HudCtrl);
