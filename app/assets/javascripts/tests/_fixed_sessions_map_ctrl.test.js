import test from 'blue-tape';
import { mock } from './helpers';
import { FixedSessionsMapCtrl } from '../code/controllers/_fixed_sessions_map_ctrl';

test('registers a callback to map.goToAddress', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('address') ? callbacks.push(callback) : null
  };
  const map = { ...mock('goToAddress'), unregisterAll: () => {} };
  const controller = _FixedSessionsMapCtrl({ $scope, map, callbacks });

  callbacks.forEach(callback => callback({ location: 'new york' }));

  t.true(map.wasCalledWith('new york'));

  t.end();
});

const _FixedSessionsMapCtrl = ({ $scope, map, callback }) => {
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

  return FixedSessionsMapCtrl($scope, params, null, map, sensors, expandables, storage, null, null, null, null, functionBlocker, null, null, rectangles, infoWindow);
};
