angular.module("aircasting").factory('heat', function() {
  return {
    parse: function(heat) {
      var parsedHeat = _(heat).map(function(item){
        return _.str.toNumber(item);
      })
      return {highest: parsedHeat[4], high: parsedHeat[3], mid: parsedHeat[2], low: parsedHeat[1], lowest: parsedHeat[0]};
    }
  };
});

