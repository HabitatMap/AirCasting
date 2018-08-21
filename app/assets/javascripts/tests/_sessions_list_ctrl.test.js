import test from 'blue-tape';
import { mock } from './helpers';
import { SessionsListCtrl } from '../code/controllers/_sessions_list_ctrl';

test('if flag on sessions is true it calls onPanOrZoom', t => {
  const map = mock('onPanOrZoom');
  const sessions = {
    shouldUpdateWithMapPanOrZoom: () => true
  };

  _SessionsListCtrl(map, sessions);

  t.true(map.wasCalled());

  t.end();
});

test('if flag on sessions is false it calls onPanOrZoom', t => {
  const map = mock('onPanOrZoom');
  const sessions = {
    shouldUpdateWithMapPanOrZoom: () => false
  };

  _SessionsListCtrl(map, sessions);

  t.false(map.wasCalled());

  t.end();
});

const _SessionsListCtrl = (map, sessions) => {
  const scope = {
    setDefaults: () => {},
    $watch: () => {},
    $on: () => {},
    sessions
  };
  const params = { get: () => ({}), update: () => {} };
  const functionBlocker = { block: () => {} };

  return SessionsListCtrl(scope, params, null, {}, null, functionBlocker, {}, null, null, null, map);
}
