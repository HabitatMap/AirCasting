import { updateCrowdMapLayer } from './_update_crowd_map_layer';

angular.module("aircasting").factory('updateCrowdMapLayer', [
  'storage',
  'map',
  '$http',
  'buildQueryParamsForCrowdMapLayer',
  'flash',
  'params',
  'utils',
  'infoWindow',
  'rectangles',
  '$location',
  updateCrowdMapLayer
]);
