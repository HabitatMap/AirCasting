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

test('levelName returns low when heat level between lowest and low' , t => {
  const heatStub = _heat();

  const actual = heatStub.levelName(1)

  t.equal(actual, "low")

  t.end()
});

test('levelName returns mid when heat level between low and mid' , t => {
  const heatStub = _heat();

  const actual = heatStub.levelName(11)

  t.equal(actual, "mid")

  t.end()
});

test('levelName returns high when heat level between mid and high' , t => {
  const heatStub = _heat();

  const actual = heatStub.levelName(51)

  t.equal(actual, "high")

  t.end()
});

test('levelName returns highest when heat level between high and highest' , t => {
  const heatStub = _heat();

  const actual = heatStub.levelName(101)

  t.equal(actual, "highest")

  t.end()
});

test('levelName returns null when heat level outside of scope' , t => {
  const heatStub = _heat();

  const actual = heatStub.levelName(151)

  t.equal(actual, null)

  t.end()
});

const _heat = () => {
  const params = { get: () => ({ heat: { lowest: 0, low: 10, mid: 50, high: 100, highest: 150 }})};
  const $rootScope = { $new: () => ({ $watch: () => {} }) };

  return heat($rootScope, params);
};
