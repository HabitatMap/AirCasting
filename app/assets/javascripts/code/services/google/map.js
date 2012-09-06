angular.module("google").factory("map", ["params", "$cookieStore", "$rootScope", "digester",
                                 "rectangles", "geocoder", '$location', "$timeout",
                                     function(params, $cookieStore, $rootScope, digester,
                                              rectangles, geocoder, $location, $timeout){
  var Map = function() {};
  Map.prototype = {
    init: function(element, options) {
      this.mapObj = new google.maps.Map(element, options);
      this.listen("idle", this.saveViewport);
      this.listen("visible_changed", function(){$rootScope.$digest();}, this.mapObj.getStreetView());
      this.listen("zoom_changed", _(this.onZoomChanged).bind(this));
      this.listen("maptypeid_changed", _(this.onMapTypeIdChanged).bind(this));
      this.listeners = [];
      rectangles.init(this.mapObj);
    },
    get: function(){
      return this.mapObj;
    },
    getMapCookie: function(name) {
      return $cookieStore.get(name);
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
      var mapType = this.mapObj.getMapTypeId();
      $cookieStore.put("vp_zoom", zoom);
      $cookieStore.put("vp_lat", lat);
      $cookieStore.put("vp_lng", lng);
      $cookieStore.put("vp_mapType", mapType);
      params.update({map: {zoom: zoom, lat: lat, lng: lng, mapType: mapType}});
      digester();
    },
    appendViewport: function(obj) {
      if(!obj || !(obj.north && obj.east && obj.south && obj.west)) {
        return;
      }
      var northeast = new google.maps.LatLng(obj.north, obj.east);
      var southwest = new google.maps.LatLng(obj.south, obj.west);
      var bounds = new google.maps.LatLngBounds(southwest, northeast);
      var self = this;
      self.mapObj.fitBounds(bounds);
      $timeout(function(){
        self.mapObj.fitBounds(bounds);
      });
    },
    onZoomChanged: function() {
      // if zoom is too high for terrain map, switch to hybrid map (but remember last used type)
      var zoom = this.getZoom();
      var newMapTypeId;
      if(zoom >= 15 && this.mapObj.getMapTypeId() == google.maps.MapTypeId.TERRAIN) {
        newMapTypeId = google.maps.MapTypeId.HYBRID;
        this.previousMapTypeId = google.maps.MapTypeId.TERRAIN;
      } else if(zoom < 15 && this.previousMapTypeId){
        //if zoom is low enough for terrain map, switch to it if it was used before zooming in
        newMapTypeId = this.previousMapTypeId;
        this.previousMapTypeId = null;
      }
      //Zooming and MapType has been handled by other events
      if(newMapTypeId) {
        this.mapObj.setMapTypeId(newMapTypeId);
        $cookieStore.put("vp_mapType", newMapTypeId);
      }
    },
    onMapTypeIdChanged: function() {
      var mapType = this.mapObj.getMapTypeId();
      params.update({map: {mapType: mapType}});
      digester();
    },
    listen: function(name, callback, diffmap) {
      return google.maps.event.addListener(diffmap || this.mapObj, name, _(callback).bind(this));
    },
    register: function(name, callback, diffmap) {
      this.listeners.push(this.listen(name, callback, diffmap));
    },
    unregisterAll: function(){
      _(this.listeners).each(function(listener){
         google.maps.event.removeListener(listener);
      });
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
        self.listen('click', function(){
          clickCallback(rectangle.data);
        }, rectangle);
      });
    },
    drawMarker: function(latLngObj, optionInput, existingMarker){
      if(!latLngObj) {
        return;
      }
      var latlng = new google.maps.LatLng(latLngObj.latitude, latLngObj.longitude);
      var newMarker;
      if(existingMarker){
        newMarker = existingMarker.setPosition(latlng);
      } else {
        var options = {
          position: latlng,
          zIndex: 300000,
          icon: "/assets/location_marker.png",
          flat: true
        };
        _(options).extend(optionInput || {});
        newMarker = new google.maps.Marker(options);
        newMarker.setMap(this.get());
      }
      return newMarker;
    },

    removeMarker: function(marker) {
      if(!marker){
        return;
      }
      marker.setMap(null);
    },

    drawLine: function(data){
      var points = _(data).map(function(latLngObj){
        return new google.maps.LatLng(latLngObj.latitude, latLngObj.longitude);
      });
      var lineOptions = {
        map: this.get(),
        path: points,
        strokeColor: "#007bf2",
        geodesic: false
      };

      var line = new google.maps.Polyline(lineOptions);
      return line;
    }

  };

  return new Map();
}]);

