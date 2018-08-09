import { SessionsListCtrl } from './_sessions_list_ctrl';

angular.module('aircasting').controller('SessionsListCtrl', [
  '$scope',
  'params',
  'sensors',
  'storage',
  'flash',
  'functionBlocker',
  '$window',
  'drawSession',
  'openSensorDialog',
  'markerSelected',
  'map',
  SessionsListCtrl
]);
