import test from 'blue-tape';

test('test', t => {
  t.plan(2);

  t.equal(typeof Date.now, 'function');

  const start = Date.now();

  setTimeout(() => t.equal(1, 1), 100);
});

test('promise test', t => {
  return Promise.resolve(2).then(actual => t.equal(actual, 2));
});
