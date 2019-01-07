import _ from 'underscore';

export const map = (
  params,
  $cookieStore,
  $rootScope,
  digester,
  rectangles,
  geocoder,
  googleMaps
) => {
  const TIMEOUT_DELAY = process.env.NODE_ENV === 'test' ? 0 : 1000;

  var Map = function() {};

  Map.prototype = {
    init: function(element, options) {
      this.mapObj = googleMaps.init(element, options);
      this.markers = [];
      this.listen("idle", this.saveViewport);
      this.listen("visible_changed", function(){$rootScope.$digest();}, this.mapObj.getStreetView());
      this.listen("maptypeid_changed", _(this.onMapTypeIdChanged).bind(this));
      rectangles.init(this.mapObj);
    },

    get: function(){
      return this.mapObj;
    },

    getMapCookie: function(name) {
      return $cookieStore.get(name);
    },

    getBounds: function(){
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

    onPanOrZoom: function(callback) {
      googleMaps.listenPanOrZoom(this.mapObj, callback);
    },

    goToAddress: function(address) {
      if (!address) return;

      const callback = (results, status) => {
        if (!googleMaps.wasGeocodingSuccessful(status)) return;

        const latLngBounds = results[0].geometry.viewport;
        this._fitBoundsWithoutPanOrZoomCallback(this.mapObj, latLngBounds);
      };

      geocoder.get(address, callback);
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

    fitBounds: function(bounds, zoom) {
      if (!bounds) return;
      if (!(bounds.north && bounds.east && bounds.south && bounds.west)) return;

      const northeast = (bounds.north == 200 && bounds.east == 200) ?
        googleMaps.latLng(50.09024, -90.712891) : // refresh with an indoor session selected goes to US
        googleMaps.latLng(bounds.north, bounds.east);
      const southwest = googleMaps.latLng(bounds.south, bounds.west);
      const latLngBounds = googleMaps.latLngBounds(southwest, northeast);
      this._fitBoundsWithoutPanOrZoomCallback(this.mapObj, latLngBounds, zoom);
    },

    _fitBoundsWithoutPanOrZoomCallback: (mapObj, latLngBounds, zoom) => {
      googleMaps.unlistenPanOrZoom(mapObj);
      googleMaps.fitBounds(mapObj, latLngBounds);
      if (zoom) mapObj.setZoom(zoom);
      setTimeout(() => googleMaps.relistenPanOrZoom(mapObj), TIMEOUT_DELAY);
    },

    onMapTypeIdChanged: function() {
      var mapType = this.mapObj.getMapTypeId();
      params.update({map: {mapType: mapType}});
      digester();
    },

    listen: function(name, callback, diffmap) {
      return google.maps.event.addListener(diffmap || this.mapObj, name, _(callback).bind(this));
    },

    unregisterAll: function(){
      googleMaps.unlistenPanOrZoom(this.mapObj);
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

    drawMarker: function(latLngObj, optionInput, existingMarker, level){
      if(!latLngObj) {
        return;
      }
      var latlng = new google.maps.LatLng(latLngObj.latitude, latLngObj.longitude);
      var icon = "/assets/location_marker0.png";

      if (level) {
        icon = "/assets/location_marker" + level + ".png";
      }

      var newMarker;
      if(existingMarker){
        newMarker = existingMarker.setPosition(latlng);
      } else {
        var options = {
          position: latlng,
          zIndex: 300000,
          icon: icon,
          flat: true,
          session: latLngObj
        };
        _(options).extend(optionInput || {});
        newMarker = new google.maps.Marker(options);
        newMarker.addListener('click', function() {
          $rootScope.$broadcast('markerSelected', {session_id: latLngObj.id});
        });
        newMarker.setMap(this.get());
        this.markers.push(newMarker);
      }
      return newMarker;
    },

    removeMarker: function(marker) {
      if(!marker){
        return;
      }
      marker.setMap(null);
    },

    removeAllMarkers: function() {
      var markers = this.markers;
      _(markers).each(function(marker) {
        marker.setMap(null);
      });
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

    clearRectangles: function() {
      rectangles.clear();
    },

    defaultMarkerOptions: function() {
      return { title: session.title, zIndex: 0 };
    }
  };

  return new Map();
};
