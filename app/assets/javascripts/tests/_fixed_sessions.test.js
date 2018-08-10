import test from 'blue-tape';
import { fixedSessions } from '../code/services/_fixed_sessions';

test('fetch with address calls goToAddress', t => {
  const map = mockMap('goToAddress');
  const fixedSessionsService = _fixedSessionsService(map, 'new york');

  fixedSessionsService.fetch();

  t.true(map.wasCalled());

  t.end();
});

const _fixedSessionsService = (map, address) => {
  const $rootScope = { $new: () => ({}) };
  const params = { get: () => ({ location: { address } }) };
  return fixedSessions(params, null, map, null, $rootScope);
};

const mockMap = (name) => {
  let count = 0;

  return {
    viewport: () => {},
    [name]: () => { count += 1 },
    wasCalled: () => count === 1
  };
};
