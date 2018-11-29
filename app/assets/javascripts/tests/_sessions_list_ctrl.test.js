import test from 'blue-tape';
import { mock } from './helpers';
import { SessionsListCtrl } from '../code/controllers/_sessions_list_ctrl';

test('it calls onPanOrZoom', t => {
  const map = mock('onPanOrZoom');

  _SessionsListCtrl({ map });

  t.true(map.wasCalled());

  t.end();
});

test('registers a callback for the crowd map layer checkbox', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('crowdMap') ? callbacks.push(callback) : null
  };

  _SessionsListCtrl({ $scope });

  t.equal(callbacks.length, 1);

  t.end();
});

test('registers a callback for the crowd map layer resolution slider', t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) => str.includes('gridResolution') ? callbacks.push(callback) : null
  };

  _SessionsListCtrl({ $scope });

  t.equal(callbacks.length, 1);

  t.end();
});

test('when crowd map layer checkbox is ticked it delegates to service to update session with passed ids', t => {
  const callbacks = [];
  const sessionIds = [1, 2];
  const $scope = {
    $watch: (str, callback) => str.includes('crowdMap') ? callbacks.push(callback) : null
  }
  const updateCrowdMapLayer = mock('call');
  _SessionsListCtrl({ $scope, updateCrowdMapLayer });

  callbacks.forEach(callback => callback());

  t.true(updateCrowdMapLayer.wasCalled());

  t.end();
});

const _SessionsListCtrl = ({ map, $scope, updateCrowdMapLayer }) => {
  const _$scope = {
    setDefaults: () => {},
    $watch: () => {},
    $on: () => {},
    ...$scope
  };
  const params = { get: () => ({}), update: () => {} };
  const functionBlocker = { block: () => {} };
  const _map = {
    onPanOrZoom: () => {},
    ...map
  };
  const _updateCrowdMapLayer = updateCrowdMapLayer || {};

  return SessionsListCtrl(_$scope, params, null, {}, null, functionBlocker, {}, null, null, null, _map, _updateCrowdMapLayer);
}
