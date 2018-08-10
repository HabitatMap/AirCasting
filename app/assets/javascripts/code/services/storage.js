import { storage } from './_storage';

angular.module("aircasting").factory('storage', [
  'params',
  '$rootScope',
  'utils',
  storage
]);
