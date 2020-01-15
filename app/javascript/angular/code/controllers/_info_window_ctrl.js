import heat from "../../../javascript/heat";
import sensors from "../../../javascript/sensors";

export const InfoWindowCtrl = ($scope, infoWindow, map) => {
  $scope.sensors = sensors;
  $scope.infoWindow = infoWindow;

  $scope.zoomIn = () => {
    map.zoomToSelectedCluster();
  };

  $scope.class = () =>
    "info_window__avg-color " + heat.classByValue(infoWindow.data.average);
};
