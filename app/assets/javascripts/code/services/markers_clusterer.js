angular.module("aircasting").factory('markersClusterer', ['map', function(map) {

  var MarkersClusterer = function() {
    this.markerCluster = new MarkerClusterer(map.get(), [], {imagePath: '/assets/'});
  }

  MarkersClusterer.prototype = {
    draw: function(map, markers) {
      this.markerCluster = new MarkerClusterer(map, markers, {imagePath: '/assets/'});
    },

    clear: function() {
      this.markerCluster.clearMarkers();
    }
  };

  return new MarkersClusterer();
}]);
