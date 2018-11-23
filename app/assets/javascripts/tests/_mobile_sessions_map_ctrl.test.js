import test from 'blue-tape';
import { mock } from './helpers';
import { MobileSessionsMapCtrl } from '../code/controllers/_mobile_sessions_map_ctrl';

test('registers a callback to map.goToAddress', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('address') ? callbacks.push(callback) : null
  };
  const map = mock('goToAddress');
  _MobileSessionsMapCtrl({ $scope, map, callbacks });

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

const _MobileSessionsMapCtrl = ({ $scope, map, callback, storage, expandables }) => {
  const _expandables = { show: () => {}, ...expandables };
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
  const _map = {
    goToAddress: () => {},
    unregisterAll: () => {},
    removeAllMarkers: () => {},
    ...map
  };
  const _$scope = { $watch: () => {}, ...$scope };

  return MobileSessionsMapCtrl(_$scope, params, _map, sensors, _expandables, _storage, null, null, null, null, functionBlocker, null, rectangles, infoWindow);
};
