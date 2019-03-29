import { FixedSessionsMapCtrl } from './_fixed_sessions_map_ctrl';

angular.module('aircasting').controller('FixedSessionsMapCtrl', [
  '$scope',
  'params',
  'heat',
  'map',
  'sensors',
  'expandables',
  'storage',
  'fixedSessions',
  'versioner',
  'storageEvents',
  'singleFixedSession',
  'functionBlocker',
  '$window',
  '$location',
  'rectangles',
  'infoWindow',
  '$http',
  //'sensorsList',
  FixedSessionsMapCtrl
]);
