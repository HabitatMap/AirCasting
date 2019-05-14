import * as MapSettings from "../directives/map_settings";

angular.module("aircasting").directive("googlemap", function() {
  return {
    link: function(scope, element) {
      // United States
      const point = {
        lat: 37.09024,
        lng: -95.712891,
        zoom: 5
      };

      const map = scope.map;
      const params = scope.params.get("map") || {};
      const lat = params.lat || map.getMapCookie("vp_lat") || point.lat;
      const lng = params.lng || map.getMapCookie("vp_lng") || point.lng;
      const latlng = new google.maps.LatLng(lat, lng);
      const zoom = params.zoom || map.getMapCookie("vp_zoom") || point.zoom;
      const mapType = params.mapType || google.maps.MapTypeId.roadmap;
      const minZoom = 3;

      let options = {
        center: latlng,
        controlSize: 24,
        fullscreenControl: false,
        minZoom,
        mapTypeId: mapType,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.TERRAIN,
            google.maps.MapTypeId.HYBRID
          ]
        },
        panControl: false,
        streetViewControl: true,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP
        },
        styles: MapSettings.mapSettings(),
        zoom: parseInt(zoom, 10),
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP
        }
      };
      map.init(element[0], options);
    }
  };
});
