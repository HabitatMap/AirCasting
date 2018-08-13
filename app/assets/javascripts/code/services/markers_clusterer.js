const markersClusterer = map => {
  const styles = [{
    url: '/assets/1.png',
    height: 53,
    width: 53,
    textColor: 'white'
  }];

  const options = { styles };

  let markerCluster = new MarkerClusterer(map.get(), [], options);

  return {
    draw: function(map, markers) {
      markerCluster = new MarkerClusterer(map, markers, options);
    },

    clear: function() {
      markerCluster.clearMarkers();
    }
  };
};

angular.module("aircasting").factory('markersClusterer', ['map', markersClusterer]);
