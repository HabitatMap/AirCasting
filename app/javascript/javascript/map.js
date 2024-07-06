import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import _ from "underscore";
import * as Cookies from "./cookies";
import { buildCustomMarker } from "./customMarker";
import googleMaps from "./googleMaps";
import heat from "./heat";
import {
  getHasChangedProgrammatically,
  onMapInit,
  setHasChangedProgrammatically,
} from "./mapsUtils";
import params from "./params2";
import pubsub from "./pubsub";
import rectangles from "./rectangles";
import { fixedClusterStyles, pulsingMarkerStyles } from "./theme";

export default (() => {
  const TIMEOUT_DELAY = 1000;
  setHasChangedProgrammatically(false);
  window.__traceMarkers = [];

  var Map = function () {};

  Map.prototype = {
    init: function (element, options) {
      this.mapObj = googleMaps.init(element, options);
      onMapInit();
      this.traceMarkers = window.__traceMarkers;
      this.addListener("idle", this.saveViewport);
      googleMaps.addListenerOnce(this.mapObj, "idle", () =>
        pubsub.publish("googleMapsReady")
      );
      this.addListener(
        "maptypeid_changed",
        _(this.onMapTypeIdChanged).bind(this)
      );

      const locationInputs = document.querySelectorAll(".js--location");

      for (var i = 0; i < locationInputs.length; i++) {
        const autocomplete = new google.maps.places.Autocomplete(
          locationInputs[i]
        );
        autocomplete.bindTo("bounds", this.mapObj);

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          this._goToAddress(place);
          window.__elmApp.ports.locationUpdated.send(place.formatted_address);
        });
      }

      rectangles.init(this.mapObj);
    },

    get: function () {
      return this.mapObj;
    },

    getBounds: function () {
      var bounds = this.mapObj.getBounds();
      if (bounds) {
        return {
          west: bounds.getSouthWest().lng(),
          east: bounds.getNorthEast().lng(),
          south: bounds.getSouthWest().lat(),
          north: bounds.getNorthEast().lat(),
        };
      } else {
        return {};
      }
    },

    onPanOrZoom: function (callback) {
      googleMaps.listenPanOrZoom(this.mapObj, callback);
    },

    _goToAddress: function (place) {
      if (!place.geometry) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        console.log("No details available for input: '" + place.name + "'");
        return;
      }

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        this._fitBoundsWithoutPanOrZoomCallback(place.geometry.viewport);
      } else {
        const fnc = () => {
          this.mapObj.setCenter(place.geometry.location);
          this.mapObj.setZoom(17); // Why 17? Because it looks good
        };
        this._withoutPanOrZoomCallback(fnc);
      }
    },

    saveViewport: function () {
      var zoom = this.getZoom();
      var lat = this.mapObj.getCenter().lat();
      var lng = this.mapObj.getCenter().lng();
      var mapType = this.mapObj.getMapTypeId();
      Cookies.set("vp_zoom", zoom);
      Cookies.set("vp_lat", lat);
      Cookies.set("vp_lng", lng);
      const newParams = {
        map: {
          zoom: zoom,
          lat: lat,
          lng: lng,
          mapType: mapType,
          hasChangedProgrammatically: getHasChangedProgrammatically(),
        },
      };
      params.update(newParams);
      setHasChangedProgrammatically(false);
      pubsub.publish("googleMapsChanged", newParams.map);
    },

    fitBounds: function (bounds, zoom) {
      const fnc = (latLngBounds, zoom) => () =>
        this._fitBoundsWithoutPanOrZoomCallback(latLngBounds, zoom);
      this._fitBounds(bounds, zoom, fnc);
    },

    fitBoundsWithBottomPadding: function (bounds, zoom) {
      const fnc = (latLngBounds, zoom) => () => {
        googleMaps.fitBoundsWithBottomPadding(this.mapObj, latLngBounds);
        if (zoom) this.mapObj.setZoom(zoom);
      };
      this._fitBounds(bounds, zoom, fnc);
    },

    _fitBounds: function (bounds, zoom, fnc) {
      if (!bounds) return;
      if (!(bounds.north && bounds.east && bounds.south && bounds.west)) return;

      const northeast =
        bounds.north == 200 && bounds.east == 200
          ? googleMaps.latLng(50.09024, -90.712891) // refresh with an indoor session selected goes to US
          : googleMaps.latLng(bounds.north, bounds.east);
      const southwest = googleMaps.latLng(bounds.south, bounds.west);
      const latLngBounds = googleMaps.latLngBounds(southwest, northeast);
      setHasChangedProgrammatically(true);
      this._withoutPanOrZoomCallback(fnc(latLngBounds, zoom));
    },

    _fitBoundsWithoutPanOrZoomCallback: function (latLngBounds, zoom) {
      const fnc = () => {
        googleMaps.fitBounds(this.mapObj, latLngBounds);
        if (zoom) this.mapObj.setZoom(zoom);
      };
      this._withoutPanOrZoomCallback(fnc);
    },

    _withoutPanOrZoomCallback: function (fnc) {
      googleMaps.unlistenPanOrZoom(this.mapObj);
      fnc();
      setTimeout(
        () => googleMaps.relistenPanOrZoom(this.mapObj),
        TIMEOUT_DELAY
      );
    },

    onMapTypeIdChanged: function () {
      var mapType = this.mapObj.getMapTypeId();
      params.update({ map: { mapType: mapType } });
    },

    addListener: function (name, callback, diffmap) {
      const cb = _(callback).bind(this);
      return googleMaps.addListener(diffmap || this.mapObj, name, cb);
    },

    unregisterAll: function () {
      googleMaps.unlistenPanOrZoom(this.mapObj);
    },

    setZoom: function (zoom) {
      return this.mapObj.setZoom(zoom);
    },

    getZoom: function (zoom) {
      return this.mapObj.getZoom();
    },

    drawRectangles: function (data, thresholds, clickCallback) {
      var self = this;
      rectangles.draw(data, thresholds);
      _(rectangles.get()).each(function (rectangle) {
        self.addListener(
          "click",
          function () {
            clickCallback({
              north: rectangle.data.north,
              south: rectangle.data.south,
              west: rectangle.data.west,
              east: rectangle.data.east,
            });
          },
          rectangle
        );
      });
    },

    drawMarker: function ({ position, title, zIndex, icon }) {
      var newMarker = new google.maps.Marker({ position, title, zIndex, icon });

      newMarker.setMap(this.get());

      return newMarker;
    },

    drawMarkerWithoutLabel: function ({
      object,
      content,
      colorClass,
      callback,
    }) {
      const customMarker = buildCustomMarker({
        object,
        content,
        colorClass,
        callback,
        type: "marker",
      });

      customMarker.setMap(this.get());

      return customMarker;
    },

    drawMarkerWithLabel: function ({ object, content, colorClass, callback }) {
      const customMarker = buildCustomMarker({
        object,
        content,
        colorClass,
        callback,
        type: "data-marker",
      });

      customMarker.setMap(this.get());

      return customMarker;
    },

    drawPulsatingMarker: function (position, level) {
      const pulsatingSessionMarker = this.drawMarker({
        position: position,
        icon: {
          // in order to place the center of the marker in the provided position
          // anchor = (marker-width/2, marker-height/2) = (50/2, 50/2) = (25, 25)
          anchor: new google.maps.Point(24, 24),
          url: pulsingMarkerStyles()[level],
        },
      });
      pulsatingSessionMarker.setAnimation(true);

      return pulsatingSessionMarker;
    },

    clusterMarkers: function (onClusterClick) {
      const render = ({ position, markers }) => {
        const average =
          markers.reduce((sum, marker) => sum + marker.value(), 0) /
          markers.length;
        const index = heat.getLevel(Math.round(average)) - 1
        const icon = fixedClusterStyles(index) || fixedClusterStyles(0);
        return new google.maps.Marker({ position, icon });
      };

      const markerClusterer = new MarkerClusterer({
        map: this.mapObj,
        markers: window.__map.customMarkers,
        algorithm: new SuperClusterAlgorithm({ maxZoom: 21, radius: 40 }),
        onClusterClick,
        renderer: { render },
      });

      window.__map.clusterers.push(markerClusterer);
    },

    setSelectedCluster: function (cluster) {
      this.selectedCluster = cluster;
    },

    zoomToSelectedCluster: function () {
      googleMaps.fitBounds(this.mapObj, this.selectedCluster.bounds);
    },

    drawLine: function (points) {
      const path = points.map(
        (point) => new google.maps.LatLng(point.latitude, point.longitude)
      );
      var lineOptions = {
        map: this.get(),
        path,
        strokeColor: "#00b2ef",
        strokeOpacity: 0.2,
        geodesic: false,
      };

      return new google.maps.Polyline(lineOptions);
    },

    fromLatLngToPoint: function (latLng) {
      return googleMaps.fromLatLngToPoint(this.mapObj, { lat: latLng.lat(), lng: latLng.lng() });
    },
  };

  return new Map();
})();

export const removeMarker = function (marker) {
  if (!marker) {
    return;
  }
  marker.setMap(null);
};

export const drawTraceMarker = ({ position }) => {
  const customMarker = buildCustomMarker({
    object: { latLng: new google.maps.LatLng(position) },
    colorClass: "trace",
    type: "marker",
  });

  customMarker.setMap(window.__map);
  window.__traceMarkers.push(customMarker);

  return customMarker;
};
