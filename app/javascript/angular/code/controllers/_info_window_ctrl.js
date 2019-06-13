export const InfoWindowCtrl = ($scope, sensors, infoWindow, map, heat) => {
  $scope.sensors = sensors;
  $scope.infoWindow = infoWindow;

  $scope.zoomIn = () => {
    map.zoomToSelectedCluster();
  };

  $scope.class = () =>
    "info_window__avg-color " + heat.classByValue(infoWindow.data.average);
};
