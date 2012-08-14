angular.module("aircasting").factory('heat', ["$rootScope", "params", function($rootScope, params) {
  var Heat = function() {
    var self = this;
    this.heatPercentage = {};
    this.scope = $rootScope.$new();
    this.scope.params = params;
    this.scope.$watch("params.get('data').heat", function(newValue, oldValue) {
      if(!newValue || _(newValue).isEmpty()){
        return;
      }
      var value = newValue;
      var scale =  value.highest - value.lowest;
      var percentageHeat = {
        highest: Math.round((1.0 * (value.highest - value.high) / scale) * 100),
        high :  Math.round((1.0 * (value.high - value.mid) / scale) * 100),
        mid : Math.round((1.0 * (value.mid - value.low) / scale ) * 100)
      };
      percentageHeat.low =  (100 - percentageHeat.highest - percentageHeat.high - percentageHeat.mid);
      _(["highest", "high", "mid", "low"]).each(function(heat){
        self.heatPercentage[heat] = {width: percentageHeat[heat] + "%"};
      });
    }, true);
  };

  Heat.prototype = {
    get: function() {
      return this.heatPercentage;
    },
    parse: function(heat) {
      var parsedHeat = _(heat).map(function(item){
        return _.str.toNumber(item);
      });
      return {
        highest: parsedHeat[4],
        high: parsedHeat[3],
        mid: parsedHeat[2],
        low: parsedHeat[1],
        lowest: parsedHeat[0]
      };
    },
    toList: function(objectWithHeats) {
      var names = ["highest", "high", "mid", "low", "lowest"];
      return _(names).map(function(name){
        return objectWithHeats[name];
      });
    }
  };

  return new Heat();
}]);

