import { buildQueryParamsForCrowdMapLayer } from "./_build_query_params_for_crowd_map_layer";

angular
  .module("aircasting")
  .factory("buildQueryParamsForCrowdMapLayer", [
    "sensors",
    "params",
    "utils",
    buildQueryParamsForCrowdMapLayer
  ]);
