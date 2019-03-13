export const InfoWindowCtrl = (
  $scope,
  sensors,
  infoWindow,
  map
) => {
  $scope.sensors = sensors;
  $scope.infoWindow = infoWindow;

  $scope.zoomIn = () => {
    map.zoomToSelectedCluster()
  }
};
