import test from 'blue-tape';
import { SessionsListCtrl } from '../code/controllers/_sessions_list_ctrl';

test('it sets onPanOrZoom', t => {
  const map = mock('onPanOrZoom');
  const sessions = {
    shouldUpdateWithMapPanOrZoom: () => true
  };

  _SessionsListCtrl(map, sessions);

  t.true(map.wasCalled());

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

const mock = (name) => {
  let calls = [];

  return {
    [name]: arg => calls.push(arg),
    wasCalled: () => calls.length === 1,
    wasCalledWith: (arg) => deepEqual(arg, calls[calls.length - 1])
  };
};
