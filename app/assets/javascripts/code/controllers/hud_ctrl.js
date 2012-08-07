function HudCtrl($scope, googleMapManager) {
  $scope.googleMapManager = googleMapManager;

  $scope.onZoom = function(event, ui) {
    googleMapManager.setZoom(ui.value);
  };

  $scope.zoomStep = function(step) {
    googleMapManager.setZoom(googleMapManager.getZoom() + step);
  };

}
HudCtrl.$inject = ['$scope', 'googleMapManager'];
