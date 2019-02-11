import test from 'blue-tape';
import { mock } from './helpers';
import { FixedSessionsMapCtrl } from '../code/controllers/_fixed_sessions_map_ctrl';

test('registers a callback to map.goToAddress', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('address') ? callbacks.push(callback) : null
  };
  const map = { ...mock('goToAddress'), unregisterAll: () => {}, removeAllMarkers: () => {} };
  const controller = _FixedSessionsMapCtrl({ $scope, map, callbacks });

  callbacks.forEach(callback => callback({ location: 'new york' }));

  t.true(map.wasCalledWith('new york'));

  t.end();
});

test('it updates defaults', t => {
  let defaults = {};
  const sensorId = "sensor id";
  const params = {
    get: () => ({ sensorId })
  };
  const storage = {
    updateDefaults: opts => defaults = opts
  };

  _FixedSessionsMapCtrl({ storage, params });

  const expected = {
    sensorId,
    location: {
      address: "",
      indoorOnly: false,
      streaming: true
    },
    tags: "",
    usernames: "",
    crowdMap: true,
  };
  t.deepEqual(defaults, expected);

  t.end();
});

const _FixedSessionsMapCtrl = ({ $scope, map, callback, storage, params }) => {
  const expandables = { show: () => {} };
  const sensors = { setSensors: () => {} };
  const functionBlocker = { block: () => {} };
  const _params = { get: () => ({}), ...params };
  const rectangles = { clear: () => {} };
  const infoWindow = { hide: () => {} };
  const _storage = {
    updateDefaults: () => {},
    updateFromDefaults: () => {},
    ...storage
  };
  const _$scope = { $watch: () => {}, ...$scope };
  const _map = { unregisterAll: () => {}, removeAllMarkers: () => {}, ...map };

  return FixedSessionsMapCtrl(_$scope, _params, null, _map, sensors, expandables, _storage, null, null, null, null, functionBlocker, null, null, rectangles, infoWindow);
};
