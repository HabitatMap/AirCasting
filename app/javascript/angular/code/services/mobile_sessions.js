import { mobileSessions } from './_mobile_sessions';

angular.module("aircasting").factory('mobileSessions', [
  'params',
  '$http',
  'map',
  'sensors',
  '$rootScope',
  'utils',
  'sessionsDownloader',
  'drawSession',
  'boundsCalculator',
  'sessionsUtils',
  '$location',
  'storage',
  'heat',
  mobileSessions
]);
