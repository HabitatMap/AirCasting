import * as MapSettings from "../../../javascript/mapSettings";
import * as Cookies from "../../../javascript/cookies";
import { getParams } from "../../../javascript/params";

const UNITED_STATES = {
  lat: 37.09024,
  lng: -95.712891,
  zoom: 5
};

angular.module("aircasting").directive("googlemap", function() {
  return {
    link: function(scope, element) {
      const map = scope.map;
      const params = getParams().map || {};
      const lat = params.lat || Cookies.get("vp_lat") || UNITED_STATES.lat;
      const lng = params.lng || Cookies.get("vp_lng") || UNITED_STATES.lng;
      const latlng = new google.maps.LatLng(lat, lng);
      const zoom = params.zoom || Cookies.get("vp_zoom") || UNITED_STATES.zoom;
      const mapType = params.mapType || google.maps.MapTypeId.roadmap;
      const minZoom = 3;

      let options = {
        center: latlng,
        controlSize: 25,
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
        zoomControl: false
      };
      map.init(element[0], options);
    }
  };
});
