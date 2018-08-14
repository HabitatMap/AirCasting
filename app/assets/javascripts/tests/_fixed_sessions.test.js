import test from 'blue-tape';
import { fixedSessions } from '../code/services/_fixed_sessions';

test('fetch with address calls goToAddress', t => {
  const map = mockMap('goToAddress');
  const data = buildData({ location: { address: 'new york' } });
  const fixedSessionsService = _fixedSessions({ map, data });

  fixedSessionsService._fetch();

  t.true(map.wasCalled());

  t.end();
});

test('fetch with no address does not call goToAddress', t => {
  const map = mockMap('goToAddress');
  const data = buildData({ location: { address: undefined } });
  const fixedSessionsService = _fixedSessions({ map, data });

  fixedSessionsService.fetch();

  t.false(map.wasCalled());

  t.end();
});

test('fetch with empty address does not call goToAddress', t => {
  const map = mockMap('goToAddress');
  const data = buildData({ location: { address: '' } });
  const fixedSessionsService = _fixedSessions({ map, data });

  fixedSessionsService.fetch();

  t.false(map.wasCalled());

  t.end();
});

test('fetch with no sessions ids in params passes empty array to sessionsDownloader', t => {
  const args = [];
  const data = buildData();
  const sessionIds = [];
  const fixedSessionsService = _fixedSessions({ args, data, sessionIds });

  fixedSessionsService.fetch();

  t.deepEqual(args[0].session_ids, sessionIds);

  t.end();
});

test('fetch with sessions ids in params passes them to sessionsDownloader', t => {
  const args = [];
  const data = buildData();
  const sessionIds = [1, 2, 3];
  const fixedSessionsService = _fixedSessions({ args, data, sessionIds });

  fixedSessionsService.fetch();

  t.deepEqual(args[0].session_ids, sessionIds);

  t.end();
});

test('fetch with time params passes them to sessionsDownloader after subtracting an offset from utils', t => {
  const args = [];
  const data = buildData({ time: { timeFrom: 1, timeTo: 2 } });
  const utils = { timeOffset: 1 };
  const fixedSessionsService = _fixedSessions({ args, data, utils });

  fixedSessionsService.fetch();

  t.deepEqual(args[0].time_from, 0);
  t.deepEqual(args[0].time_to, 1);

  t.end();
});

test('fetch with day and year params passes them to sessionsDownloader', t => {
  const args = [];
  const data = buildData({ time: { dayFrom: 3, dayTo: 4, yearFrom: 5, yearTo: 6 } });
  const fixedSessionsService = _fixedSessions({ args, data });

  fixedSessionsService.fetch();

  t.deepEqual(args[0].day_from, 3);
  t.deepEqual(args[0].day_to, 4);
  t.deepEqual(args[0].year_from, 5);
  t.deepEqual(args[0].year_to, 6);

  t.end();
});

test('fetch with tags and usernames params passes them to sessionsDownloader', t => {
  const args = [];
  const data = buildData({ tags: "tag1, tag2", usernames: "will123, agata" });
  const fixedSessionsService = _fixedSessions({ args, data });

  fixedSessionsService.fetch();

  t.deepEqual(args[0].tags, "tag1, tag2");
  t.deepEqual(args[0].usernames, "will123, agata");

  t.end();
});

test('fetch with outdoorOnly set to true passes is_indoor false to sessionsDownloader', t => {
  const args = [];
  const data = buildData({ location: { outdoorOnly: true, address: '' } });
  const fixedSessionsService = _fixedSessions({ args, data });

  fixedSessionsService.fetch();

  t.deepEqual(args[0].is_indoor, false);

  t.end();
});

test('fetch with outdoorOnly set to false does not pass is_indoor to sessionsDownloader', t => {
  const args = [];
  const data = buildData({ location: { outdoorOnly: false, address: '' } });
  const fixedSessionsService = _fixedSessions({ args, data });

  fixedSessionsService.fetch();

  t.deepEqual(args[0].is_indoor, undefined);

  t.end();
});

test('fetch with no time in params does not call downloadSessions', t => {
  const args = [];
  const data = buildData({ time: undefined });
  const fixedSessionsService = _fixedSessions({ args, data });

  fixedSessionsService.fetch();

  t.true(args.length === 0);

  t.end();
});

test('fetch with time calls drawSession.clear', t => {
  const drawSession = mock('clear');
  const data = buildData({ time: {} });
  const fixedSessionsService = _fixedSessions({ data, drawSession });

  fixedSessionsService.fetch();

  t.true(drawSession.wasCalled());

  t.end();
});

test('fetch with time calls downloadSessions', t => {
  const args = [];
  const data = buildData({ time: {} });
  const fixedSessionsService = _fixedSessions({ args, data });

  fixedSessionsService.fetch();

  t.true(args.length > 0);

  t.end();
});

const buildData = obj => ({ time: {}, location: {}, ...obj });

const _fixedSessions = ({ args = [], map, data, drawSession, utils, sessionIds = [] }) => {
  const $rootScope = { $new: () => ({}) };
  const params = {
    get: what => {
      if (what === "data") {
        return data || buildData();
      } else if (what === "sessionsIds") {
        return sessionIds || [];
      } else {
        throw new Error(`unexpected param ${what}`);
      }
    }
  };
  const _map = map || { viewport: () => ({}) };
  const _utils = utils || {};
  const sensors = { selected: () => {} };
  const _drawSession = drawSession || { clear: () => {} };
  const sessionsDownloader = (_, arg) => { args.push(arg) };

  return fixedSessions(params, null, _map, sensors, $rootScope, _utils, sessionsDownloader, _drawSession);
};

const mock = (name) => {
  let calls = [];

  return {
    [name]: arg => calls.push(arg),
    wasCalled: () => calls.length === 1,
    wasCalledWith: (arg) => deepEqual(arg, calls[calls.length - 1])
  };
};

const mockMap = (name) => {
  let count = 0;

  return {
    viewport: () => ({}),
    [name]: () => { count += 1 },
    wasCalled: () => count === 1
  };
};
