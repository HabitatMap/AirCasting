import { sensors } from './_sensors';

angular.module("aircasting").factory('sensors', ['params', 'storage', 'heat', '$http', sensors]);
