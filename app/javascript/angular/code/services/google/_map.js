import _ from 'underscore';
import { buildCustomMarker } from './custom_marker';
import MarkerClusterer from "@google/markerclustererplus";

export const map = (
  params,
  $cookieStore,
  $rootScope,
  digester,
  rectangles,
  geocoder,
  googleMaps,
  heat,
) => {
  const TIMEOUT_DELAY = process.env.NODE_ENV === 'test' ? 0 : 1000;
  let hasChangedProgrammatically = false;

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
      params.update({map: {zoom: zoom, lat: lat, lng: lng, mapType: mapType, hasChangedProgrammatically}});
      hasChangedProgrammatically = false;
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
      hasChangedProgrammatically = true;
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
      const cb = _(callback).bind(this);
      return googleMaps.listen(diffmap || this.mapObj, name, cb);
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
          clickCallback({
            north: rectangle.data.north,
            south: rectangle.data.south,
            west: rectangle.data.west,
            east: rectangle.data.east
          });
        }, rectangle);
      });
    },

    drawMarker: function({ position, title, zIndex, icon }){
      var newMarker = new google.maps.Marker({ position, title, zIndex, icon });

      newMarker.setMap(this.get());
      this.markers.push(newMarker);

      return newMarker;
    },

    drawCustomMarker: function({ latLng, content, colorClass, callback, type, objectId, value }) {
      const customMarker = buildCustomMarker(latLng, content, colorClass, callback, type, objectId, value );

      customMarker.setMap(this.get());
      this.markers.push(customMarker);

      return customMarker;
    },

    clusterMarkers: function(onClick) {
      const options = {
        styles: [
          { url: '/assets/marker1.png', height: 10, width: 10 },
          { url: '/assets/marker2.png', height: 10, width: 10 },
          { url: '/assets/marker3.png', height: 10, width: 10 },
          { url: '/assets/marker4.png', height: 10, width: 10 },
        ],
        zoomOnClick: false,
        gridSize: 20,
        calculator: (markers, stylesCount) => {
          const average = markers.reduce((sum, marker) => sum + marker.value(), 0) / markers.length
          return { text: "", index: heat.getLevel(Math.round(average)) }
        }
      };

      const markerClusterer = new MarkerClusterer(this.mapObj, this.markers, options);

      googleMaps.listen(markerClusterer, 'clusterclick', onClick);
      this.clusterer = markerClusterer;
    },

    removeMarker: function(marker) {
      if(!marker){
        return;
      }
      marker.setMap(null);
    },

    removeAllMarkers: function() {
      if (this.clusterer) this.clusterer.clearMarkers();

      (this.markers || []).forEach(marker => marker.setMap(null));
      this.markers = [];
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

    fromLatLngToPoint: function(latLng) { return googleMaps.fromLatLngToPoint(this.mapObj, latLng); },
  };

  return new Map();
};
