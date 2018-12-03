import test from 'blue-tape';
import { mock } from './helpers';
import { SessionsListCtrl } from '../code/controllers/_sessions_list_ctrl';

test('it calls onPanOrZoom', t => {
  const map = mock('onPanOrZoom');

  _SessionsListCtrl(map);

  t.true(map.wasCalled());

  t.end();
});

const _SessionsListCtrl = (map) => {
  const scope = {
    setDefaults: () => {},
    $watch: () => {},
    $on: () => {},
  };
  const params = { get: () => ({}), update: () => {} };
  const functionBlocker = { block: () => {} };

  return SessionsListCtrl(scope, params, null, {}, null, functionBlocker, {}, null, null, null, map);
}
