import { SessionsListCtrl } from './_sessions_list_ctrl';

angular.module('aircasting').controller('SessionsListCtrl', [
  '$scope',
  'params',
  'sensors',
  'storage',
  'flash',
  '$window',
  'drawSession',
  'markerSelected',
  'updateCrowdMapLayer',
  SessionsListCtrl
]);
