import test from 'blue-tape';
import { mock } from './helpers';
import { MobileSessionsMapCtrl } from '../code/controllers/_mobile_sessions_map_ctrl';

test('registers a callback to map.goToAddress', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('address') ? callbacks.push(callback) : null
  };
  const map = mock('goToAddress');
  _MobileSessionsMapCtrl({ $scope, map });

  callbacks.forEach(callback => callback({ location: 'new york' }));

  t.true(map.wasCalledWith('new york'));

  t.end();
});

test('it shows by default sensor, location, usernames and layers sections', t => {
  const shown = [];
  const expandables = {
    show: name => shown.push(name)
  };

  _MobileSessionsMapCtrl({ expandables });

  t.deepEqual(shown, ['sensor', 'location', 'usernames', 'layers']);

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

  _MobileSessionsMapCtrl({ storage, params });

  const expected = {
    sensorId,
    location: {address: ""},
    tags: "",
    usernames: "",
    gridResolution: 25,
    crowdMap: false,
    heat: { highest: 150, high: 55, mid: 35, low: 12, lowest: 0 }
  };
  t.deepEqual(defaults, expected);

  t.end();
});

const _MobileSessionsMapCtrl = ({ $scope, map, callback, storage, expandables, sensors, params }) => {
  const _expandables = { show: () => {}, ...expandables };
  const _sensors = { setSensors: () => {}, ...sensors };
  const functionBlocker = { block: () => {} };
  const _params = { get: () => ({}), ...params };
  const infoWindow = { hide: () => {} };
  const _storage = {
    updateDefaults: () => {},
    updateFromDefaults: () => {},
    ...storage
  };
  const _map = {
    goToAddress: () => {},
    unregisterAll: () => {},
    removeAllMarkers: () => {},
    clearRectangles: () => {},
    ...map
  };
  const _$scope = { $watch: () => {}, ...$scope };

  return MobileSessionsMapCtrl(_$scope, _params, _map, _sensors, _expandables, _storage, null, null, null, null, functionBlocker, null, infoWindow);
};
