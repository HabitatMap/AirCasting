import { sessionsUtils } from './_sessions_utils';

angular.module("aircasting").factory('sessionsUtils', [
  'params',
  'sensors',
  "$timeout",
  'flash',
  'updateCrowdMapLayer',
  sessionsUtils
]);

