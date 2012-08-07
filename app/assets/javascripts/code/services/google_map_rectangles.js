angular.module("aircasting").factory("googleMapRectangles",  function(){
  var GoogleMapRectTool = function() {
    this.rectangles = [];
    this.colors = [null, "#2DA641", "#F9DC2E", "#F57F22", "#F4001C"];
  };
  GoogleMapRectTool.prototype = {
    init: function(googleMap){
      this.googleMap = googleMap;
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
          self.rectangles.push(rectangle);
        }
      });
    },

    getColor: function(levels, value){
      if(levels.length === 0 ) {
        return;
      }
      var level = _(levels).detect(function(level){
        return value < level;
      }) || _(levels).last();

      return this.colors[_(levels).indexOf(level)];
    },
    clear: function() {
      _(this.rectangles).each(function(rectangle){
        rectangle.setMap(null);
      });
      this.rectangles = [];
    }
  };

  return new GoogleMapRectTool();
});

