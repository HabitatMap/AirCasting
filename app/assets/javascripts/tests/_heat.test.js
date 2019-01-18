import test from 'blue-tape';
import { mock } from './helpers';
import { heat } from '../code/services/_heat';

test('outsideOfScope return true when value outside of scope', t => {
  const heatStub = _heat();

  const actual = heatStub.outsideOfScope(-1)

  t.equal(actual, true)

  t.end()
});

test('outsideOfScope return false when value inside scope', t => {
  const heatStub = _heat();

  const actual = heatStub.outsideOfScope(1)

  t.equal(actual, false)

  t.end()
});

const _heat = () => {
  const params = { get: () => ({ heat: { lowest: 0, highest: 150 }})};
  const $rootScope = { $new: () => ({ $watch: () => {} }) };

  return heat($rootScope, params);
};
