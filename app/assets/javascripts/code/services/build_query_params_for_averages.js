import { buildQueryParamsForAverages } from './_build_query_params_for_averages';

angular.module("aircasting").factory('buildQueryParamsForAverages', [
  'map',
  'sensors',
  'params',
  'utils',
  'mobileSessions',
  buildQueryParamsForAverages
]);
