import test from 'blue-tape';
import { fixedSessions } from '../code/services/_fixed_sessions';

test('fetch with address calls goToAddress', t => {
  const $rootScope = { $new: () => ({}) };
  const map = mockMap();
  const params = { get: () => ({ location: { address: 'new york' } }) };
  const fixedSessions_ = fixedSessions(params, null, map, null, $rootScope);

  fixedSessions_.fetch();

  t.true(map.wasCalled());

  t.end();
});

const mockMap = () => {
  let count = 0;

  return {
    viewport: () => {},
    goToAddress: () => { count += 1 },
    wasCalled: () => count === 1
  };
};
