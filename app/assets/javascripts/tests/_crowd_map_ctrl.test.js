import test from 'blue-tape';
import { CrowdMapCtrl } from '../code/controllers/_crowd_map_ctrl';
import deepEqual from 'fast-deep-equal';

test('registers a callback to map.goToAddress', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('address') ? callbacks.push(callback) : null
  };
  // diff from fixed_sessions_map_ctrl
  const map = { ...mock('goToAddress'), unregisterAll: () => {}, register: () => {}, removeAllMarkers: () => {}, viewport: () => {} };
  const controller = _CrowdMapCtrl({ $scope, map, callbacks });

  callbacks.forEach(callback => callback({ location: 'new york' }));

  t.true(map.wasCalledWith('new york'));

  t.end();
});

const _CrowdMapCtrl = ({ $scope, map, callback }) => {
  const expandables = { show: () => {} };
  const sensors = { setSensors: () => {}, selected: () => {} };
  const functionBlocker = { block: () => {} };
  // diff from fixed_sessions_map_ctrl
  const params = { get: () => ({}) };
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

  return CrowdMapCtrl($scope, null, params, null, null, map, sensors, expandables, null, null, storage, null, infoWindow, rectangles, functionBlocker, null, null, markersClusterer);
};
const mock = (name) => {
  let calls = [];

  return {
    [name]: arg => calls.push(arg),
    wasCalled: () => calls.length === 1,
    wasCalledWith: (arg) => deepEqual(arg, calls[calls.length - 1])
  };
};
