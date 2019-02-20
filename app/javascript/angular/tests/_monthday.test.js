import test from 'blue-tape';
import { toDayOfYear, toMonthDay } from '../code/directives/_monthday';

test('toDayOfYear with first day of the year returns 1', t => {
  const actual = toDayOfYear('01/01');

  const expected = 1;
  t.deepEqual(actual, expected);

  t.end();
});

test('toDayOfYear with last day of the year returns 365', t => {
  const actual = toDayOfYear('12/31');

  const expected = 365;
  t.deepEqual(actual, expected);

  t.end();
});

test('toMonthDay with 1 returns first day of the year', t => {
  const actual = toMonthDay(1);

  const expected = '01/01';
  t.deepEqual(actual, expected);

  t.end();
});

test('toMonthDay with 365 returns last day of the year', t => {
  const actual = toMonthDay(365);

  const expected = '12/31';
  t.deepEqual(actual, expected);

  t.end();
});
