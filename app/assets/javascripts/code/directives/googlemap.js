angular.module("aircasting").directive('googlemap', function(googleMapManager, $cookies){
  return {
    link: function(scope, element, attrs, controller) {
      var lat = $cookies.vp_lat || 38.693861956002024;
      var lng = $cookies.vp_lng || -87.5;
      var latlng = new google.maps.LatLng(lat, lng);
      var zoom = $cookies.vp_zoom || 5;
      var minZoom = 3;
      var options = {
        zoom: parseInt(zoom),
        minZoom: minZoom,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
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
      googleMapManager.init(element[0], options);
    }
  };
});
