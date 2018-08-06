var test = require('blue-tape');

test('timing test', function (t) {
  t.plan(2);

  t.equal(typeof Date.now, 'function');
  var start = Date.now();

  setTimeout(function () {
    t.equal(1, 1);
  }, 100);
});
