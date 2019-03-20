angular.module("google").factory("graphHighlight",  ["map",
                                 function(map){
  var GraphHighlight = function() {
    this.items = [];
  };
  GraphHighlight.prototype = {
    hide: function() {
      _(this.items).each(function(item){
        map.removeMarker(item.marker);
      });
      this.items = [];
    },
    show: function(points){
      this.hide();
      var self = this;
      _(points).each(function(point){
        self.items.push({marker: map.drawMarker({
          position: { lat: point.latitude, lng: point.longitude },
          zIndex: 300000,
          icon: "/assets/location_marker0.png"
        }), point: point});
      });
    }
  };

  return new GraphHighlight();
}]);
