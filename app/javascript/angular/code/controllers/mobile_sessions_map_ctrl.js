import { MobileSessionsMapCtrl } from './_mobile_sessions_map_ctrl';

angular.module('aircasting').controller('MobileSessionsMapCtrl', [
  '$scope',
  'params',
  'map',
  'sensors',
  'storage',
  'mobileSessions',
  'versioner',
  'singleMobileSession',
  'functionBlocker',
  '$window',
  "infoWindow",
  'sessionsUtils',
  MobileSessionsMapCtrl
]);
