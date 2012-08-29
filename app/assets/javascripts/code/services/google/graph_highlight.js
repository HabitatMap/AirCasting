angular.module("google").factory("graphHighlight",  ["map",
                                 function(map){
  var GraphHighlight = function() {
    this.marker = undefined;
    this.point = undefined;
  };
  GraphHighlight.prototype = {
    hide: function(point) {
      if(!this.marker){
        return;
      }
      map.removeMarker(this.marker);
      delete this.marker;
    },
    show: function(point){
      this.hide();
      this.point = point;
      this.marker = map.drawMarker(point, null, this.marker);
    }
  };

  return new GraphHighlight();
}]);
