angular.module("google").factory("map", ["params", "$cookies", "$rootScope", "rectangles", "geocoder", '$location',
                                     function(params, $cookies, $rootScope, rectangles, geocoder, $location){
  var Map = function() {};
  Map.prototype = {
    init: function(element, options) {
      this.mapObj = new google.maps.Map(element, options);
      this.listen("idle", this.saveViewport);
      this.listen("visible_changed", function(){$rootScope.$digest();}, this.mapObj.getStreetView());
      this.listen("zoom_changed", _(this.onZoomChanged).bind(this));
      this.listen("maptypeid_changed", _(this.onMapTypeIdChanged).bind(this));
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
      var mapType = this.mapObj.getMapTypeId();

      $cookies.vp_zoom = zoom;
      $cookies.vp_lat = lat;
      $cookies.vp_lng = lng;

      params.update({map: {zoom: zoom, lat: lat, lng: lng, mapType: mapType}});
      params.digest();
    },
    appendViewport: function(obj) {
      if(!(obj.north && obj.east && obj.south && obj.west)) {
        return;
      }
      var northeast = new google.maps.LatLng(obj.north, obj.east);
      var southwest = new google.maps.LatLng(obj.south, obj.west);
      var bounds = new google.maps.LatLngBounds(southwest, northeast);
      this.mapObj.fitBounds(bounds);
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
      }
    },
    onMapTypeIdChanged: function() {
      var mapType = this.mapObj.getMapTypeId();
      params.update({map: {mapType: mapType}});
      params.digest();
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
        self.listen('click', function(){
          clickCallback(rectangle.data);
        }, rectangle);
      });
    },
    drawMarker: function(latLngObj, optionInput, existingMarker){
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
    },

    drawNote: function(note){
      var marker = this.drawMarker(note, {
        title: note.text,
        icon: "/assets/marker_note.png",
        zIndex: 200000
      });

      google.maps.event.addListener(marker, 'click', function(){
        console.log("display Note");
      });
      return marker;
    }
  };

  return new Map();
}]);

