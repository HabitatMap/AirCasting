import { FixedSessionsMapCtrl } from './_fixed_sessions_map_ctrl';

angular.module('aircasting').controller('FixedSessionsMapCtrl', [
  '$scope',
  'params',
  'heat',
  'map',
  'sensors',
  'storage',
  'fixedSessions',
  'versioner',
  'singleFixedSession',
  'functionBlocker',
  '$window',
  'rectangles',
  'infoWindow',
  '$http',
  FixedSessionsMapCtrl
]);
