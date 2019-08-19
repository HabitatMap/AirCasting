import _ from "underscore";
import { buildCustomMarker } from "./custom_marker";
import MarkerClusterer from "@google/markerclustererplus";
import {
  fixedClusterStyles,
  pulsingMarkerStyles
} from "../../../../javascript/theme";

export const map = (
  params,
  $cookieStore,
  $rootScope,
  digester,
  rectangles,
  geocoder,
  googleMaps,
  heat,
  $window
) => {
  const TIMEOUT_DELAY = process.env.NODE_ENV === "test" ? 0 : 1000;
  let hasChangedProgrammatically = false;
  $window.__traceMarkers = [];

  var Map = function() {};

  Map.prototype = {
    init: function(element, options) {
      this.mapObj = googleMaps.init(element, options);
      this.traceMarkers = $window.__traceMarkers;
      this.addListener("idle", this.saveViewport);
      googleMaps.addListenerOnce(this.mapObj, "idle", () =>
        $rootScope.$broadcast("googleMapsReady")
      );
      this.addListener(
        "visible_changed",
        function() {
          $rootScope.$digest();
        },
        this.mapObj.getStreetView()
      );
      this.addListener(
        "maptypeid_changed",
        _(this.onMapTypeIdChanged).bind(this)
      );
      rectangles.init(this.mapObj);
    },

    get: function() {
      return this.mapObj;
    },

    getMapCookie: function(name) {
      return $cookieStore.get(name);
    },

    getBounds: function() {
      var bounds = this.mapObj.getBounds();
      if (bounds) {
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
        this._fitBoundsWithoutPanOrZoomCallback(latLngBounds);
      };

      geocoder.get(address, callback);
    },

    saveViewport: function() {
      var zoom = this.getZoom();
      var lat = this.mapObj.getCenter().lat();
      var lng = this.mapObj.getCenter().lng();
      var mapType = this.mapObj.getMapTypeId();
      $cookieStore.put("vp_zoom", zoom);
      $cookieStore.put("vp_lat", lat);
      $cookieStore.put("vp_lng", lng);
      $cookieStore.put("vp_mapType", mapType);
      params.update({
        map: {
          zoom: zoom,
          lat: lat,
          lng: lng,
          mapType: mapType,
          hasChangedProgrammatically
        }
      });
      hasChangedProgrammatically = false;
      digester();
    },

    fitBounds: function(bounds, zoom) {
      const fnc = (latLngBounds, zoom) => () =>
        this._fitBoundsWithoutPanOrZoomCallback(latLngBounds, zoom);
      this._fitBounds(bounds, zoom, fnc);
    },

    fitBoundsWithBottomPadding: function(bounds, zoom) {
      const fnc = (latLngBounds, zoom) => () => {
        googleMaps.fitBoundsWithBottomPadding(this.mapObj, latLngBounds);
        if (zoom) this.mapObj.setZoom(zoom);
      };
      this._fitBounds(bounds, zoom, fnc);
    },

    _fitBounds: function(bounds, zoom, fnc) {
      if (!bounds) return;
      if (!(bounds.north && bounds.east && bounds.south && bounds.west)) return;

      const northeast =
        bounds.north == 200 && bounds.east == 200
          ? googleMaps.latLng(50.09024, -90.712891) // refresh with an indoor session selected goes to US
          : googleMaps.latLng(bounds.north, bounds.east);
      const southwest = googleMaps.latLng(bounds.south, bounds.west);
      const latLngBounds = googleMaps.latLngBounds(southwest, northeast);
      hasChangedProgrammatically = true;
      this._withoutPanOrZoomCallback(fnc(latLngBounds, zoom));
    },

    _fitBoundsWithoutPanOrZoomCallback: function(latLngBounds, zoom) {
      const fnc = () => {
        googleMaps.fitBounds(this.mapObj, latLngBounds);
        if (zoom) this.mapObj.setZoom(zoom);
      };
      this._withoutPanOrZoomCallback(fnc);
    },

    _withoutPanOrZoomCallback: function(fnc) {
      googleMaps.unlistenPanOrZoom(this.mapObj);
      fnc();
      setTimeout(
        () => googleMaps.relistenPanOrZoom(this.mapObj),
        TIMEOUT_DELAY
      );
    },

    onMapTypeIdChanged: function() {
      var mapType = this.mapObj.getMapTypeId();
      params.update({ map: { mapType: mapType } });
      digester();
    },

    addListener: function(name, callback, diffmap) {
      const cb = _(callback).bind(this);
      return googleMaps.addListener(diffmap || this.mapObj, name, cb);
    },

    unregisterAll: function() {
      googleMaps.unlistenPanOrZoom(this.mapObj);
    },

    setZoom: function(zoom) {
      return this.mapObj.setZoom(zoom);
    },

    getZoom: function(zoom) {
      return this.mapObj.getZoom();
    },

    drawRectangles: function(data, thresholds, clickCallback) {
      var self = this;
      rectangles.draw(data, thresholds);
      _(rectangles.get()).each(function(rectangle) {
        self.addListener(
          "click",
          function() {
            clickCallback({
              north: rectangle.data.north,
              south: rectangle.data.south,
              west: rectangle.data.west,
              east: rectangle.data.east
            });
          },
          rectangle
        );
      });
    },

    drawMarker: function({ position, title, zIndex, icon }) {
      var newMarker = new google.maps.Marker({ position, title, zIndex, icon });

      newMarker.setMap(this.get());

      return newMarker;
    },

    drawMarkerWithoutLabel: function({
      object,
      content,
      colorClass,
      callback
    }) {
      const customMarker = buildCustomMarker({
        object,
        content,
        colorClass,
        callback,
        type: "marker"
      });

      customMarker.setMap(this.get());

      return customMarker;
    },

    drawMarkerWithLabel: function({ object, content, colorClass, callback }) {
      const customMarker = buildCustomMarker({
        object,
        content,
        colorClass,
        callback,
        type: "data-marker"
      });

      customMarker.setMap(this.get());

      return customMarker;
    },

    drawPulsatingMarker: function(position, level) {
      const pulsatingSessionMarker = this.drawMarker({
        position: position,
        icon: {
          // in order to place the center of the marker in the provided position
          // anchor = (marker-width/2, marker-height/2) = (50/2, 50/2) = (25, 25)
          anchor: new google.maps.Point(24, 24),
          url: pulsingMarkerStyles()[level]
        }
      });
      pulsatingSessionMarker.setAnimation(true);

      return pulsatingSessionMarker;
    },

    clusterMarkers: function(onClick) {
      const options = {
        styles: fixedClusterStyles(),
        zoomOnClick: false,
        gridSize: 20,
        maxZoom: 21,
        calculator: markers => {
          // calculator returns an index value that is used to select the corresponding style from the styles array by: styles[index -1]
          // documented at: https://htmlpreview.github.io/?https://github.com/googlemaps/v3-utility-library/blob/master/markerclustererplus/docs/reference.html
          const average =
            markers.reduce((sum, marker) => sum + marker.value(), 0) /
            markers.length;
          return { text: "", index: heat.getLevel(Math.round(average)) };
        }
      };

      const markerClusterer = new MarkerClusterer(
        this.mapObj,
        window.__map.customMarkers,
        options
      );

      googleMaps.addListener(markerClusterer, "clusterclick", onClick);
      window.__map.clusterers.push(markerClusterer);
    },

    setSelectedCluster: function(cluster) {
      this.selectedCluster = cluster;
    },

    zoomToSelectedCluster: function() {
      googleMaps.fitBounds(this.mapObj, this.selectedCluster.bounds_);
    },

    drawLine: function(points) {
      const path = points.map(
        point => new google.maps.LatLng(point.latitude, point.longitude)
      );
      var lineOptions = {
        map: this.get(),
        path,
        strokeColor: "#09a7f0",
        strokeOpacity: 0.2,
        geodesic: false
      };

      return new google.maps.Polyline(lineOptions);
    },

    fromLatLngToPoint: function(latLng) {
      return googleMaps.fromLatLngToPoint(this.mapObj, latLng);
    }
  };

  return new Map();
};

export const removeMarker = function(marker) {
  if (!marker) {
    return;
  }
  marker.setMap(null);
};

export const drawTraceMarker = ({ position }) => {
  const customMarker = buildCustomMarker({
    object: { latLng: new google.maps.LatLng(position) },
    colorClass: "trace",
    type: "marker"
  });

  customMarker.setMap(window.__map);
  window.__traceMarkers.push(customMarker);

  return customMarker;
};
