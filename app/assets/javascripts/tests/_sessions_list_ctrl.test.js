import test from 'blue-tape';
import { mock } from './helpers';
import { SessionsListCtrl } from '../code/controllers/_sessions_list_ctrl';

test('it calls onPanOrZoom', t => {
  const map = mock('onPanOrZoom');

  _SessionsListCtrl({ map });

  t.true(map.wasCalled());

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
  const $location = {
    path: () => "/map_sessions"
  };

  return SessionsListCtrl(_$scope, params, null, {}, null, functionBlocker, {}, null, null, null, _map, _updateCrowdMapLayer, $location);
};

