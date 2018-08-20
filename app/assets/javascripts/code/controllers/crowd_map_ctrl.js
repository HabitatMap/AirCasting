import { CrowdMapCtrl } from './_crowd_map_ctrl';

angular.module('aircasting').controller('CrowdMapCtrl', [
  '$scope',
  '$http',
  'params',
  'heat',
  '$window', 'map',
  'sensors',
  'expandables',
  '$location',
  'versioner',
  'storage',
  'storageEvents',
  'infoWindow',
  'rectangles',
  'functionBlocker',
  'utils',
  'flash',
  'markersClusterer',
  'sensorsList',
  CrowdMapCtrl
]);
