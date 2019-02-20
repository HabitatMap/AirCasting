angular.module("google").factory("rectangles",  function(){
  var Rectangles = function() {
    this.rectangles = [];
    this.colors = [null, "#2DA641", "#F9DC2E", "#F57F22", "#F4001C"];
  };
  Rectangles.prototype = {
    init: function(googleMap){
      this.googleMap = googleMap;
    },
    get: function() {
      return this.rectangles;
    },
    getData: function() {
      return _(this.rectangles).pluck("data");
    },
    position: function(region){
      var lat = (region.south + region.north) / 2;
      var lng = (region.east + region.west) / 2;
      return new google.maps.LatLng(lat, lng);
    },
    draw: function(rectangles, thresholds){
      var rectOptions, rectangle, color;
      var self = this;
      this.clear();
      _(rectangles).each(function(data){
        color = self.getColor(thresholds, data.value);
        if(color) {
          rectOptions = {
            strokeWeight: 0,
            fillColor: color,
            fillOpacity: 0.35,
            map: self.googleMap,
            bounds: new google.maps.LatLngBounds(
              new google.maps.LatLng(data.south, data.west),
              new google.maps.LatLng(data.north, data.east)
            )
          };
          rectangle = new google.maps.Rectangle(rectOptions);
          rectangle.data = data;
          self.rectangles.push(rectangle);
        }
      });
    },

    getColor: function(levels, value){
      if(levels.length === 0 ) {
        return;
      }
      var level = _(levels).detect(function(l){
        return value < l;
      });

      return this.colors[_(levels).indexOf(level)];
    },
    clear: function() {
      _(this.rectangles).each(function(rectangle){
        rectangle.setMap(null);
      });
      this.rectangles = [];
    }
  };

  return new Rectangles();
});

