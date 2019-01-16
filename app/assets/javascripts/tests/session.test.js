import test from 'blue-tape';
import { formatSessionForList } from '../code/values/session';

test('when title is missing it defaults to unnamed', t => {
  const session = {};

  const actual = formatSessionForList(session);

  t.deepEqual(actual.title, 'unnamed');

  t.end();
});

test('when title is present it uses it', t => {
  const title = 'walk to the park';
  const session = {
    title
  };

  const actual = formatSessionForList(session);

  t.deepEqual(actual.title, title);

  t.end();
});

test('when session is indoor it uses anonymous as username', t => {
  const session = {
    is_indoor: true
  };

  const actual = formatSessionForList(session);

  t.deepEqual(actual.username, 'anonymous');

  t.end();
});

test('when session is outdoor it uses its username', t => {
  const username = 'user1234';
  const session = {
    is_indoor: false,
    username
  };

  const actual = formatSessionForList(session);

  t.deepEqual(actual.username, username);

  t.end();
});
