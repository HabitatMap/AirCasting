import heat from "../../../javascript/heat";

export const InfoWindowCtrl = ($scope, sensors, infoWindow, map) => {
  $scope.sensors = sensors;
  $scope.infoWindow = infoWindow;

  $scope.zoomIn = () => {
    map.zoomToSelectedCluster();
  };

  $scope.class = () =>
    "info_window__avg-color " + heat.classByValue(infoWindow.data.average);
};
