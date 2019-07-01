angular.module("google").factory("rectangles", function() {
  var Rectangles = function() {
    this.colors = [null, "#96d788", "#ffd960", "#fca443", "#e95f5f"];

    window.__elmApp.ports.toggleTheme.subscribe(isCustomThemeOn => {
      if (isCustomThemeOn) {
        this.colors = [null, "#81dbcb", "#4ebcd5", "#2a70b8", "#19237e"];
      } else {
        this.colors = [null, "#96d788", "#ffd960", "#fca443", "#e95f5f"];
      }
      this.updateRectangles();
    });
  };
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
    draw: function(rectangles) {
      var rectOptions, rectangle, color;
      var self = this;
      _(rectangles).each(function(data) {
        color = self.getColor(heats(), data.value);
        if (color) {
          rectOptions = {
            strokeWeight: 0,
            fillColor: color,
            fillOpacity: 0.5,
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

      return this.colors[_(levels).indexOf(level)];
    },
    updateRectangles: function() {
      window.__map.rectangles.forEach(rec => {
        rec.setOptions({
          fillColor: this.getColor(heats(), rec.data.value)
        });
      });
    }
  };

  return new Rectangles();
});

const heats = () => {
  return Object.values(params().data.heat).sort();
};

const params = () =>
  window.location.hash
    .slice(2)
    .split("&")
    .filter(x => x.length !== 0)
    .map(x => x.split("="))
    .map(([k, v]) => [k, decodeURIComponent(v)])
    .map(([k, v]) => [k, JSON.parse(v)])
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
