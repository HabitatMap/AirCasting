import { updateCrowdMapLayer } from './_update_crowd_map_layer';

angular.module("aircasting").factory('updateCrowdMapLayer', [
  'storage',
  'map',
  '$http',
  'buildQueryParamsForCrowdMapLayer',
  'flash',
  '$location',
  'params',
  'utils',
  'infoWindow',
  'rectangles',
  updateCrowdMapLayer
]);
