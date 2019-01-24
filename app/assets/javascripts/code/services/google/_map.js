import _ from 'underscore';

var Popup;

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

    drawCustomMarker: function({
        latLng: latLng,
        content: content,
        colorClass: colorClass,
        clicableObject: clicableObject
      }) {

      definePopupClass();

      const popup = new Popup(latLng, content, colorClass, $rootScope, clicableObject);

      popup.setMap(this.get());
      this.markers.push(popup);

      return popup;
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
  };

  return new Map();
};


function definePopupClass() {
  /**
   * A customized popup on the map.
   * @param {!google.maps.LatLng} position
   * @param {!Element} content
   * @constructor
   * @extends {google.maps.OverlayView}
   */
  Popup = function(position, content, colorClass, $rootScope, clicableObject) {
    this.position = position;

    this.anchor = document.createElement('div');
    this.anchor.classList.add('fixed-marker');
    this.anchor.classList.add(colorClass);
    this.anchor.innerText = content;
    this.anchor.addEventListener('click', function() {
      console.log('CLICKED')
      $rootScope.$broadcast('markerSelected', {session_id: clicableObject});
    });

    // Optionally stop clicks, etc., from bubbling up to the map.
    this.stopEventPropagation();
  };
  // NOTE: google.maps.OverlayView is only defined once the Maps API has
  // loaded. That is why Popup is defined inside initMap().
  Popup.prototype = Object.create(google.maps.OverlayView.prototype);

  /** Called when the popup is added to the map. */
  Popup.prototype.onAdd = function() {
    this.getPanes().floatPane.appendChild(this.anchor);
  };

  /** Called when the popup is removed from the map. */
  Popup.prototype.onRemove = function() {
    if (this.anchor.parentElement) {
      this.anchor.parentElement.removeChild(this.anchor);
    }
  };

  /** Called when the popup needs to draw itself. */
  Popup.prototype.draw = function() {
    var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);
    // Hide the popup when it is far out of view.
    var display =
        Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ?
        'block' :
        'none';

    if (display === 'block') {
      this.anchor.style.left = divPosition.x + 'px';
      this.anchor.style.top = divPosition.y + 'px';
    }
    if (this.anchor.style.display !== display) {
      this.anchor.style.display = display;
    }
  };

  /** Stops clicks/drags from bubbling up to the map. */
  Popup.prototype.stopEventPropagation = function() {
    var anchor = this.anchor;
    anchor.style.cursor = 'auto';

    ['click', 'dblclick', 'contextmenu', 'wheel', 'mousedown', 'touchstart',
     'pointerdown']
        .forEach(function(event) {
          anchor.addEventListener(event, function(e) {
            e.stopPropagation();
          });
        });
  };
}
