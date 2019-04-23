import { heat } from "./_heat";

angular
  .module("aircasting")
  .factory("heat", ["$rootScope", "params", "storage", heat]);
