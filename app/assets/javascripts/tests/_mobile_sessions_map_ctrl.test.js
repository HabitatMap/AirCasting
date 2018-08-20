import test from 'blue-tape';
import { MobileSessionsMapCtrl } from '../code/controllers/_mobile_sessions_map_ctrl';
import deepEqual from 'fast-deep-equal';

test('registers a callback to map.goToAddress', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('address') ? callbacks.push(callback) : null
  };
  // diff from fixed_sessions_map_ctrl removeAllMarkers
  const map = mock('goToAddress');
  const controller = _MobileSessionsMapCtrl({ $scope, map, callbacks });

  callbacks.forEach(callback => callback({ location: 'new york' }));

  t.true(map.wasCalledWith('new york'));

  t.end();
});

test('registers a callback to resetAddress which is called if limit checkbox is selected', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('location.limit') ? callbacks.push(callback) : null
  };
  // diff from fixed_sessions_map_ctrl removeAllMarkers
  const storage = mock('resetAddress');
  const controller = _MobileSessionsMapCtrl({ $scope, storage, callbacks });

  callbacks.forEach(callback => callback(true));

  t.true(storage.wasCalled());

  t.end();
});

test('registers a callback to resetAddress which is not called if limit checkbox is unselected', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('location.limit') ? callbacks.push(callback) : null
  };
  // diff from fixed_sessions_map_ctrl removeAllMarkers
  const storage = mock('resetAddress');
  const controller = _MobileSessionsMapCtrl({ $scope, storage, callbacks });

  callbacks.forEach(callback => callback(false));

  t.false(storage.wasCalled());

  t.end();
});

const _MobileSessionsMapCtrl = ({ $scope, map, callback, storage }) => {
  const expandables = { show: () => {} };
  const sensors = { setSensors: () => {} };
  const functionBlocker = { block: () => {} };
  const params = { get: () => {} };
  const rectangles = { clear: () => {} };
  const infoWindow = { hide: () => {} };
  const _storage = {
    updateDefaults: () => {},
    updateFromDefaults: () => {},
    ...storage
  };
  // diff from fixed_sessions_map_ctrl
  const markersClusterer = {
    clear: () => {}
  };
  const _map = {
    goToAddress: () => {},
    unregisterAll: () => {},
    removeAllMarkers: () => {},
    ...map
  };

  return MobileSessionsMapCtrl($scope, params, _map, sensors, expandables, _storage, null, null, null, null, functionBlocker, null, rectangles, infoWindow, markersClusterer);
};

const mock = (name) => {
  let calls = [];

  return {
    [name]: arg => calls.push(arg),
    wasCalled: () => calls.length === 1,
    wasCalledWith: (arg) => deepEqual(arg, calls[calls.length - 1])
  };
};
