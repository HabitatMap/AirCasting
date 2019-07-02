import { rectanglesStyles } from "../../../../javascript/theme";

angular.module("google").factory("rectangles", function() {
  var Rectangles = function() {};
  Rectangles.prototype = {
    init: function(googleMap) {
      this.googleMap = googleMap;
    },
    get: function() {
      return window.__map.rectangles;
    },
    position: function(region) {
      var lat = (region.south + region.north) / 2;
      var lng = (region.east + region.west) / 2;
      return new google.maps.LatLng(lat, lng);
    },
    draw: function(rectangles, thresholds) {
      var rectOptions, rectangle, color;
      var self = this;
      _(rectangles).each(function(data) {
        color = self.getColor(thresholds, data.value);
        if (color) {
          rectOptions = {
            strokeWeight: 0,
            fillColor: color,
            fillOpacity: 0.6,
            map: self.googleMap,
            bounds: new google.maps.LatLngBounds(
              new google.maps.LatLng(data.south, data.west),
              new google.maps.LatLng(data.north, data.east)
            )
          };
          rectangle = new google.maps.Rectangle(rectOptions);
          rectangle.data = data;
          window.__map.rectangles.push(rectangle);
        }
      });
    },

    getColor: function(levels, value) {
      if (levels.length === 0) {
        return;
      }
      var level = _(levels).detect(function(l) {
        return value < l;
      });
      console.warn(rectanglesStyles());

      return rectanglesStyles()[_(levels).indexOf(level)];
    }
  };

  return new Rectangles();
});
