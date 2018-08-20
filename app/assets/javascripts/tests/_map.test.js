import test from 'blue-tape';
import { map } from '../code/services/google/_map';

test('goToAddress with no address it does not decode', t => {
  const geocoder = mock('get');
  const mapService = map(null, null, null, null, null, geocoder);

  mapService.goToAddress();

  t.false(geocoder.wasCalled());

  t.end();
});

test('goToAddress with address it decodes', t => {
  const geocoder = mock('get');
  const mapService = map(null, null, null, null, null, geocoder);

  mapService.goToAddress('new york');

  t.true(geocoder.wasCalled());

  t.end();
});

test('goToAddress with unsuccessful geocoding does not call fitBounds', t => {
  const geocoder = mockGeocoder();
  const googleMaps = mockGoogleMaps({ successfulGeocoding: false })
  const mapService = map(null, null, null, null, null, geocoder, googleMaps);

  mapService.goToAddress('new york');

  t.false(googleMaps.wasCalled());

  t.end();
});

test('goToAddress with successful geocoding calls fitBounds', t => {
  const geocoder = mockGeocoder();
  const googleMaps = mockGoogleMaps({ successfulGeocoding: true })
  const mapService = map(null, null, null, null, null, geocoder, googleMaps);

  mapService.goToAddress('new york');

  t.true(googleMaps.wasCalled());

  t.end();
});

test('goToAddress when calling fitBounds removes callbacks from the map', t => {
  const geocoder = mockGeocoder();
  const googleMaps = mockGoogleMaps({ successfulGeocoding: true })
  googleMaps.listen('bounds_changed', () => {});

  t.true(googleMaps.hasCallbacks());

  const mapService = map(null, null, null, null, null, geocoder, googleMaps);

  mapService.goToAddress('new york');

  t.false(googleMaps.hasCallbacks());

  t.end();
});

test('goToAddress re-adds callbacks from the map after calling fitBounds', t => {
  const geocoder = mockGeocoder();
  const googleMaps = mockGoogleMaps({ successfulGeocoding: true })
  googleMaps.listen('bounds_changed', () => {});

  const mapService = map(null, null, null, null, null, geocoder, googleMaps);

  mapService.goToAddress('new york');

  setTimeout(() => {
    t.true(googleMaps.hasCallbacks());

    t.end();
  }, 1001);
});

test('onPanOrZoom', t => {
  const googleMaps = mockGoogleMaps();
  const mapService = map(null, null, null, null, null, null, googleMaps);

  mapService.onPanOrZoom(() => {});

  t.true(googleMaps.hasCallbacks());

  t.end();
});

test('unregisterAll removes the onPanOrZoom callback too', t => {
  const googleMaps = mockGoogleMaps();
  const mapService = map(null, null, null, null, null, null, googleMaps);
  mapService.onPanOrZoom(() => {});

  mapService.unregisterAll();

  t.false(googleMaps.hasCallbacks());

  t.end();
});

const mock = (name) => {
  let calls = [];

  return {
    [name]: arg => calls.push(arg),
    wasCalled: () => calls.length === 1,
    wasCalledWith: (arg) => deepEqual(arg, calls[calls.length - 1])
  };
};

const mockGeocoder = () => ({
  get: (_, callback) => callback([ { geometry: { viewport: null } } ])
});

const mockGoogleMaps = (opts = {}) => {
  let count = 0;
  let callbacks = 0;
  const geocoding = opts.successfulGeocoding === undefined ? true : opts.successfulGeocoding;

  return {
    wasGeocodingSuccessful: () => geocoding,
    fitBounds: () => { count += 1 },
    wasCalled: () => count === 1,
    listen: (event) => { callbacks += 1 },
    hasCallbacks: () => callbacks > 0,
    unlistenPanOrZoom: () => { callbacks -= 1 },
    relistenPanOrZoom: () => { callbacks += 1 },
    listenPanOrZoom: () => { callbacks += 1 }
  };
};
