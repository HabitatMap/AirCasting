angular.module('aircasting').directive('googlemap', function() {
  return {
    link: function(scope, element) {
      // United States
      var point = {
        lat: 37.09024,
        lng: -95.712891,
        zoom: 5
      };

      var map = scope.map;
      var params = scope.params.get('map') || {};
      var lat = params.lat || point.lat;
      var lng = params.lng || point.lng;
      var latlng = new google.maps.LatLng(lat, lng);
      var zoom = params.zoom || point.zoom;
      var mapType = params.mapType || google.maps.MapTypeId.TERRAIN;
      const minZoom = 3;
      var options = {
        zoom: parseInt(zoom, 10),
        minZoom,
        center: latlng,
        mapTypeId: mapType,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.TERRAIN,
            google.maps.MapTypeId.HYBRID
          ]
        },
        zoomControl: false,
        panControl: false,
        streetViewControl: true,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER
        }
      };
      map.init(element[0], options);
    }
  };
});
