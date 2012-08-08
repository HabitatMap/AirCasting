angular.module("aircasting").directive('googlemap', function(map){
  return {
    link: function(scope, element, attrs, controller) {
      var lat = map.getMapCookie("vp_lat") || 38.693861956002024;
      var lng = map.getMapCookie("vp_lng") || -87.5;
      var latlng = new google.maps.LatLng(lat, lng);
      var zoom = map.getMapCookie("vp_zoom") || 5;
      var minZoom = 3;
      var options = {
        zoom: parseInt(zoom, 10),
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
      map.init(element[0], options);
    }
  };
});
