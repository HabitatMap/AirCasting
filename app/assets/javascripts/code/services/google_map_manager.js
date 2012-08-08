angular.module("aircasting").factory("googleMapManager", ["$cookies", "$rootScope", "googleMapRectangles", "geocoder",
                                     function($cookies, $rootScope, googleMapRectangles, geocoder){
  var GoogleMapTool = function() {
  };
  GoogleMapTool.prototype = {
    init: function(element, options) {
      this.googleMap = new google.maps.Map(element, options);
      this.listen("idle", this.saveViewport);
      this.listen("visible_changed", function(){$rootScope.$digest();}, this.googleMap.getStreetView());
      this.listen("zoom_changed", _(this.appendMapType).bind(this));
      googleMapRectangles.init(this.googleMap);
    },
    getMapCookie: function(name) {
      return $cookies[name];
    },
    viewport: function(){
      var bounds = this.googleMap.getBounds();
      if(bounds) {
        return {
          west: bounds.getSouthWest().lng(),
          east: bounds.getNorthEast().lng(),
          south: bounds.getSouthWest().lat(),
          north: bounds.getNorthEast().lat()
        };
      } else {
        return {};
      }
    },
    goToAddress: function(address) {
      if(!address){
        return;
      }
      var self = this;
      geocoder.get(address, function(results, status) {
        if(status == google.maps.GeocoderStatus.OK) {
          self.googleMap.fitBounds(results[0].geometry.viewport);
        }
      });
    },
    saveViewport: function(){
      var zoom = this.getZoom();
      var lat = this.googleMap.getCenter().lat();
      var lng = this.googleMap.getCenter().lng();

      $cookies.vp_zoom = zoom;
      $cookies.vp_lat = lat;
      $cookies.vp_lng = lng;
    },
    appendViewport: function(north, east, south, west) {
      if(!(north && east && south && west)) {
        return;
      }
      var northeast = new google.maps.LatLng(north, east);
      var southwest = new google.maps.LatLng(south, west);
      var bounds = new google.maps.LatLngBounds(southwest, northeast);
      this.googleMap.fitBounds(bounds);
    },
    appendMapType: function() {
      // if zoom is too high for terrain map, switch to hybrid map (but remember last used type)
      var zoom = this.getZoom();
      if(zoom >= 15 && this.googleMap.getMapTypeId() == google.maps.MapTypeId.TERRAIN) {
        this.googleMap.setMapTypeId(google.maps.MapTypeId.HYBRID);
        this.previousMapTypeId = google.maps.MapTypeId.TERRAIN;
      } else if(zoom < 15 && this.previousMapTypeId){
        //if zoom is low enough for terrain map, switch to it if it was used before zooming in
        this.googleMap.setMapTypeId(this.previousMapTypeId);
        this.previousMapTypeId = null;
      }
    },
    listen: function(name, callback, map) {
      google.maps.event.addListener(map || this.googleMap, name, _(callback).bind(this));
    },
    setZoom: function(zoom) {
      return this.googleMap.setZoom(zoom);
    },
    getZoom: function(zoom) {
      return this.googleMap.getZoom();
    },
    streetViewVisible: function(zoom) {
      return this.googleMap.getStreetView().getVisible();
    },
    drawRectangles: function(data, thresholds, clickCallback){
      googleMapRectangles.draw(data, thresholds);
      _(googleMapRectangles.rectangles).each(function(rectangle){
        google.maps.event.addListener(rectangle, 'click',  clickCallback);
      });
    }
  };

  return new GoogleMapTool();
}]);

