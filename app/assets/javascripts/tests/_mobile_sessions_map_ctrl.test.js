import test from 'blue-tape';
import { MobileSessionsMapCtrl } from '../code/controllers/_mobile_sessions_map_ctrl';
import deepEqual from 'fast-deep-equal';

test('registers a callback to map.goToAddress', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('address') ? callbacks.push(callback) : null
  };
  // diff from fixed_sessions_map_ctrl removeAllMarkers
  const map = { ...mock('goToAddress'), unregisterAll: () => {}, removeAllMarkers: () => {} };
  const controller = _MobileSessionsMapCtrl({ $scope, map, callbacks });

  callbacks.forEach(callback => callback({ location: 'new york' }));

  t.true(map.wasCalledWith('new york'));

  t.end();
});

const _MobileSessionsMapCtrl = ({ $scope, map, callback }) => {
  const expandables = { show: () => {} };
  const sensors = { setSensors: () => {} };
  const functionBlocker = { block: () => {} };
  const params = { get: () => {} };
  const rectangles = { clear: () => {} };
  const infoWindow = { hide: () => {} };
  const storage = {
    updateDefaults: () => {},
    updateFromDefaults: () => {}
  };
  // diff from fixed_sessions_map_ctrl
  const markersClusterer = {
    clear: () => {}
  };

  return MobileSessionsMapCtrl($scope, params, null, map, sensors, expandables, storage, null, null, null, null, functionBlocker, null, null, rectangles, infoWindow, markersClusterer);
};

const mock = (name) => {
  let calls = [];

  return {
    [name]: arg => calls.push(arg),
    wasCalled: () => calls.length === 1,
    wasCalledWith: (arg) => deepEqual(arg, calls[calls.length - 1])
  };
};
