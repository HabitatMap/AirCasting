import test from "blue-tape";
import deepEqual from "fast-deep-equal";
import { mock } from "./helpers";
import { map } from "../code/services/google/_map.js";
import sinon from "sinon";

test("goToAddress with no address it does not decode", t => {
  const geocoder = mock("get");
  const service = _map({ geocoder });

  service.goToAddress();

  t.false(geocoder.wasCalled());

  t.end();
});

test("goToAddress with address it decodes", t => {
  const geocoder = mock("get");
  const service = _map({ geocoder });

  service.goToAddress("new york");

  t.true(geocoder.wasCalled());

  t.end();
});

test("goToAddress with unsuccessful geocoding does not call fitBounds", t => {
  const geocoder = mockGeocoder();
  const googleMaps = mockGoogleMaps({ successfulGeocoding: false });
  const service = _map({ geocoder, googleMaps });

  service.goToAddress("new york");

  t.false(googleMaps.wasCalled());

  t.end();
});

test("goToAddress with successful geocoding calls fitBounds", t => {
  const geocoder = mockGeocoder();
  const googleMaps = mockGoogleMaps({ successfulGeocoding: true });
  const service = _map({ geocoder, googleMaps });

  service.goToAddress("new york");

  t.true(googleMaps.wasCalled());

  t.end();
});

test("goToAddress when calling fitBounds removes callbacks from the map", t => {
  const geocoder = mockGeocoder();
  const googleMaps = mockGoogleMaps({ successfulGeocoding: true });
  googleMaps.addListener("bounds_changed", () => {});

  t.true(googleMaps.hasCallbacks());

  const service = _map({ geocoder, googleMaps });

  service.goToAddress("new york");

  t.false(googleMaps.hasCallbacks());

  t.end();
});

test("goToAddress re-adds callbacks from the map after calling fitBounds", t => {
  const geocoder = mockGeocoder();
  const googleMaps = mockGoogleMaps({ successfulGeocoding: true });
  googleMaps.addListener("bounds_changed", () => {});

  const service = _map({ geocoder, googleMaps });

  service.goToAddress("new york");

  setTimeout(() => {
    t.true(googleMaps.hasCallbacks());

    t.end();
  }, 0);
});

test("onPanOrZoom", t => {
  const googleMaps = mockGoogleMaps();
  const service = _map({ googleMaps });

  service.onPanOrZoom(() => {});

  t.true(googleMaps.hasCallbacks());

  t.end();
});

test("unregisterAll removes the onPanOrZoom callback too", t => {
  const googleMaps = mockGoogleMaps();
  const service = _map({ googleMaps });
  service.onPanOrZoom(() => {});

  service.unregisterAll();

  t.false(googleMaps.hasCallbacks());

  t.end();
});

test("fitBounds calls fitBounds", t => {
  const googleMaps = mockGoogleMaps();
  const service = _map({ googleMaps });

  service.fitBounds({
    north: 1,
    east: 2,
    south: 3,
    west: 4
  });

  t.true(googleMaps.wasFitBoundsCalledWith([[3, 4], [1, 2]]));

  t.end();
});

test("fitBounds with coord 200 north and 200 east calls fitBounds with a specific northeast coords", t => {
  const googleMaps = mockGoogleMaps();
  const service = _map({ googleMaps });

  service.fitBounds({
    north: 200,
    east: 200,
    south: 1,
    west: 2
  });

  t.true(googleMaps.wasFitBoundsCalledWith([[1, 2], [50.09024, -90.712891]]));

  t.end();
});

test("fitBounds when calling fitBounds removes callbacks from the map", t => {
  const googleMaps = mockGoogleMaps();
  googleMaps.addListener("bounds_changed", () => {});

  t.true(googleMaps.hasCallbacks());

  const service = _map({ googleMaps });

  service.fitBounds({
    north: 123,
    east: 123,
    south: 123,
    west: 123
  });

  t.false(googleMaps.hasCallbacks());

  t.end();
});

test("fitBounds re-adds callbacks from the map after calling fitBounds", t => {
  const googleMaps = mockGoogleMaps();
  googleMaps.addListener("bounds_changed", () => {});

  t.true(googleMaps.hasCallbacks());

  const service = _map({ googleMaps });

  service.fitBounds({
    north: 123,
    east: 123,
    south: 123,
    west: 123
  });

  setTimeout(() => {
    t.true(googleMaps.hasCallbacks());

    t.end();
  }, 0);
});

test("when map was not change programatically saveViewport calls params update with the correct flag", t => {
  let calls = [];
  const params = {
    update: arg => calls.push(arg)
  };
  const googleMaps = mockGoogleMaps();
  const service = _map({ params, googleMaps });
  service.init();

  service.saveViewport();

  const expected = false;
  t.equal(calls[0].map.hasChangedProgrammatically, expected);

  t.end();
});

test("when map was change programatically saveViewport calls params update with the correct flag", t => {
  let calls = [];
  const params = {
    update: arg => calls.push(arg)
  };
  const googleMaps = mockGoogleMaps();
  const service = _map({ params, googleMaps });
  service.init();
  service.fitBounds({ north: 123, east: 123, south: 123, west: 123 });

  const actual = service.saveViewport();

  const expected = true;
  t.equal(calls[0].map.hasChangedProgrammatically, expected);

  t.end();
});

test("removeAllMarkers removes all markers", t => {
  let markers = [{ setMap: _ => {} }];
  const service = _map({});
  service.markers = markers;

  service.removeAllMarkers();

  const actual = service.markers;

  const expected = [];
  t.deepEqual(actual, expected);

  t.end();
});

test("removeAllMarkers clears the clustering", t => {
  const clearMarkers = sinon.spy();
  const service = _map({});
  service.clusterer = { clearMarkers };

  service.removeAllMarkers();

  sinon.assert.called(clearMarkers);

  t.end();
});

test("drawRectangles calls rectangle.draw with data and thresholds", t => {
  const draw = sinon.spy();
  const rectangles = { draw };
  const data = { a: 1 };
  const thresholds = { b: 2 };
  const service = _map({ rectangles });

  service.drawRectangles(data, thresholds);

  t.true(draw.calledWith(data, thresholds));

  t.end();
});

test("drawRectangles sets a listener with a callback with bounds excluding other properties", t => {
  const rectangle = {
    data: { north: 1, south: 2, west: 3, east: 4, otherProperty: 0 }
  };
  const rectangles = { get: () => [rectangle] };
  const googleMaps = {
    addListener: (x, y, mapCallback) => {
      mapCallback();
    }
  };
  const service = _map({ rectangles, googleMaps });
  const callback = sinon.spy();

  service.drawRectangles({}, {}, callback);

  t.true(callback.calledWith({ north: 1, south: 2, west: 3, east: 4 }));

  t.end();
});

test("drawRectangles sets a listener on rectangle click", t => {
  const rectangle = { a: null };
  const rectangles = { get: () => [rectangle] };
  const mapListen = sinon.spy();
  const googleMaps = { addListener: mapListen };
  const service = _map({ rectangles, googleMaps });

  service.drawRectangles({}, {}, () => {});

  t.true(mapListen.calledWith(rectangle, "click"));

  t.end();
});

test("setSelectedCluster sets the passed argument as a selected cluster", t => {
  const cluster = { id: 1 };
  const service = _map({});

  service.setSelectedCluster(cluster);

  t.deepEqual(service.selectedCluster, cluster);
  t.end();
});

test("zoomToSelectedCluster calls fitBounds with current map object and bound of selected cluster", t => {
  const fitBounds = sinon.spy();
  const mapObj = sinon.stub();
  const bounds = sinon.stub();
  const googleMaps = { fitBounds };

  const service = _map({ googleMaps });
  service.selectedCluster = { bounds_: bounds };
  service.mapObj = mapObj;

  service.zoomToSelectedCluster();

  sinon.assert.calledWith(fitBounds, mapObj, bounds);

  t.end();
});

const mockGeocoder = () => ({
  get: (_, callback) => callback([{ geometry: { getBounds: null } }])
});

const mockGoogleMaps = ({ successfulGeocoding } = {}) => {
  let count = 0;
  let callbacks = 0;
  const geocoding =
    successfulGeocoding === undefined ? true : successfulGeocoding;
  const calls = [];

  return {
    wasGeocodingSuccessful: () => geocoding,
    fitBounds: (_, arg) => {
      calls.push(arg);
      count += 1;
    },
    fitBoundsWithBottomPadding: (_, arg) => {
      calls.push(arg);
      count += 1;
    },
    wasCalled: () => count === 1,
    wasFitBoundsCalledWith: arg => deepEqual(arg, calls[calls.length - 1]),
    addListener: event => {
      callbacks += 1;
    },
    hasCallbacks: () => callbacks > 0,
    unlistenPanOrZoom: () => {
      callbacks -= 1;
    },
    relistenPanOrZoom: () => {
      callbacks += 1;
    },
    listenPanOrZoom: () => {
      callbacks += 1;
    },
    latLng: (lat, lng) => [lat, lng],
    latLngBounds: (southwest, northeast) => [southwest, northeast],
    init: () => ({
      getStreetView: () => {},
      getBounds: () => {},
      getZoom: () => {},
      getCenter: () => ({ lat: () => {}, lng: () => {} }),
      getMapTypeId: () => {}
    })
  };
};

const _map = ({ geocoder, googleMaps, params, rectangles }) => {
  const digester = () => {};
  const _rectangles = {
    init: () => {},
    get: () => {},
    draw: () => {},
    ...rectangles
  };
  const $cookieStore = { put: () => {} };
  const $window = {};
  return map(
    params,
    $cookieStore,
    null,
    digester,
    _rectangles,
    geocoder,
    googleMaps,
    null,
    $window
  );
};
