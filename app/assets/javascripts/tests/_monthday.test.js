import test from 'blue-tape';
import { toDayOfYear, toMonthDay } from '../code/directives/_monthday';

test('toDayOfYear with first day of the year returns 0', t => {
  const actual = toDayOfYear('01/01');

  const expected = 0;
  t.deepEqual(actual, expected);

  t.end();
});

test('toDayOfYear with last day of the year returns 364', t => {
  const actual = toDayOfYear('12/31');

  const expected = 364;
  t.deepEqual(actual, expected);

  t.end();
});

test('toMonthDay with 0 returns first day of the year', t => {
  const actual = toMonthDay(0);

  const expected = '01/01';
  t.deepEqual(actual, expected);

  t.end();
});

test('toMonthDay with 1 returns second day of the year', t => {
  const actual = toMonthDay(1);

  const expected = '01/02';
  t.deepEqual(actual, expected);

  t.end();
});

test('toMonthDay with 364 returns last day of the year', t => {
  const actual = toMonthDay(364);

  const expected = '12/31';
  t.deepEqual(actual, expected);

  t.end();
});
