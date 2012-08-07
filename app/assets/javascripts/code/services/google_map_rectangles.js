angular.module("aircasting").factory("googleMapRectangles",  function(){
  var GoogleMapRectTool = function() {
    this.rectangles = [];
  };
  GoogleMapRectTool.prototype = {
    init: function(googleMap){
      this.googleMap = googleMap;
    },
    draw: function(rectangles, thresholds){
      var rectOptions, rectangle;
      var self = this;
      this.clear();
      _(rectangles).each(function(data){
        rectOptions = {
          strokeWeight: 0,
          fillColor: "#fffff",
          fillOpacity: 0.35,
          map: self.googleMap,
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(data.south, data.west),
            new google.maps.LatLng(data.north, data.east)
          )
        };
        rectangle = new google.maps.Rectangle(rectOptions);
        self.rectangles.push(rectangle);
      });
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

