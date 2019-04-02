import { mobileSessions } from './_mobile_sessions';

angular.module("aircasting").factory('mobileSessions', [
  'params',
  '$http',
  'map',
  'sensors',
  '$rootScope',
  'sessionsDownloader',
  'drawSession',
  'boundsCalculator',
  'sessionsUtils',
  'storage',
  'heat',
  '$window',
  mobileSessions
]);
