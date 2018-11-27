import { updateCrowdMapLayer } from './_update_crowd_map_layer';

angular.module("aircasting").factory('updateCrowdMapLayer', [
  'storage',
  'map',
  '$http',
  'buildQueryParamsForAverages',
  'flash',
  '$location',
  'params',
  'utils',
  updateCrowdMapLayer
]);
