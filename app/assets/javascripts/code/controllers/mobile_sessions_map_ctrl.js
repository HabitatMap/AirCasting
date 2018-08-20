import { MobileSessionsMapCtrl } from './_mobile_sessions_map_ctrl';

angular.module('aircasting').controller('MobileSessionsMapCtrl', [
  '$scope',
  'params',
  'heat',
  'map',
  'sensors',
  'expandables',
  'storage',
  'mobileSessions',
  'versioner',
  'storageEvents',
  'singleMobileSession',
  'functionBlocker',
  '$window',
  "$location",
  "rectangles",
  "infoWindow",
  "markersClusterer",
  'sensorsList',
  MobileSessionsMapCtrl
]);
