angular.module("google").factory("map", ["$cookies", "$rootScope", "rectangles", "geocoder",
                                     function($cookies, $rootScope, rectangles, geocoder){
  var Map = function() {};
  Map.prototype = {
    init: function(element, options) {
      this.mapObj = new google.maps.Map(element, options);
      this.listen("idle", this.saveViewport);
      this.listen("visible_changed", function(){$rootScope.$digest();}, this.mapObj.getStreetView());
      this.listen("zoom_changed", _(this.appendMapType).bind(this));
      rectangles.init(this.mapObj);
    },
    get: function(){
      return this.mapObj;
    },
    getMapCookie: function(name) {
      return $cookies[name];
    },
    viewport: function(){
      var bounds = this.mapObj.getBounds();
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
          self.mapObj.fitBounds(results[0].geometry.viewport);
        }
      });
    },
    saveViewport: function(){
      var zoom = this.getZoom();
      var lat = this.mapObj.getCenter().lat();
      var lng = this.mapObj.getCenter().lng();

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
      this.mapObj.fitBounds(bounds);
    },
    appendMapType: function() {
      // if zoom is too high for terrain map, switch to hybrid map (but remember last used type)
      var zoom = this.getZoom();
      if(zoom >= 15 && this.mapObj.getMapTypeId() == google.maps.MapTypeId.TERRAIN) {
        this.mapObj.setMapTypeId(google.maps.MapTypeId.HYBRID);
        this.previousMapTypeId = google.maps.MapTypeId.TERRAIN;
      } else if(zoom < 15 && this.previousMapTypeId){
        //if zoom is low enough for terrain map, switch to it if it was used before zooming in
        this.mapObj.setMapTypeId(this.previousMapTypeId);
        this.previousMapTypeId = null;
      }
    },
    listen: function(name, callback, diffmap) {
      google.maps.event.addListener(diffmap || this.mapObj, name, _(callback).bind(this));
    },
    setZoom: function(zoom) {
      return this.mapObj.setZoom(zoom);
    },
    getZoom: function(zoom) {
      return this.mapObj.getZoom();
    },
    streetViewVisible: function(zoom) {
      return this.mapObj.getStreetView().getVisible();
    },
    drawRectangles: function(data, thresholds, clickCallback){
      var self = this;
      rectangles.draw(data, thresholds);
      _(rectangles.get()).each(function(rectangle){
        self.listen('click',  clickCallback, rectangle);
      });
    }
  };

  return new Map();
}]);

