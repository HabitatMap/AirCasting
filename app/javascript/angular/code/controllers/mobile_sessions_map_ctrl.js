import { MobileSessionsMapCtrl } from './_mobile_sessions_map_ctrl';

angular.module('aircasting').controller('MobileSessionsMapCtrl', [
  '$scope',
  'params',
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
  "infoWindow",
  //'sensorsList',
  'sessionsUtils',
  '$http',
  MobileSessionsMapCtrl
]);
