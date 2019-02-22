import { fixedSessions } from './_fixed_sessions';

angular.module("aircasting").factory('fixedSessions', [
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
  'heat',
  fixedSessions
]);
