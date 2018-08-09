import test from 'blue-tape';
import { SessionsListCtrl } from '../code/controllers/_sessions_list_ctrl';

test('it sets onPanOrZoom', t => {
  const map = mock('onPanOrZoom');

  SessionsListCtrlWithMap(map);

  t.true(map.wasCalled());

  t.end();
});

const SessionsListCtrlWithMap = (map) => {
  const sessions = {
    shouldUpdateWithMapPanOrZoom: () => true
  };
  const scope = {
    setDefaults: () => {},
    $watch: () => {},
    $on: () => {},
    sessions
  };
  const $window = {};
  const params = { get: () => ({}), update: () => {} };
  const functionBlocker = { block: () => {} };
  const storage = {};

  return SessionsListCtrl(scope, params, null, storage, null, functionBlocker, $window, null, null, null, map);
}

const mock = (name) => {
  let count = 0;

  return {
    [name]: () => { count += 1 },
    wasCalled: () => count === 1
  };
};
