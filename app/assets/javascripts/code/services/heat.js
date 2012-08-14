angular.module("aircasting").factory('heat', function() {
  var Heat = function() {
  };

  Heat.prototype = {
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
    get: function(heat) {
      var names = ["highest", "high", "mid", "low", "lowest"];
      return _(names).map(function(name){
        return  heat[name];
      });
    }
  };

  return new Heat();
});

