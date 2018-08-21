import test from 'blue-tape';
import { mobileSessions } from '../code/services/_mobile_sessions';

test('fetch with no sessions ids in params passes empty array to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData();
  const sessionIds = [];
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls , data, sessionIds });

  mobileSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].session_ids, sessionIds);

  t.end();
});

test('fetch with sessions ids in params passes them to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData();
  const sessionIds = [1, 2, 3];
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, data, sessionIds });

  mobileSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].session_ids, sessionIds);

  t.end();
});

test('fetch with time params passes them to sessionsDownloader after subtracting an offset from utils', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: { timeFrom: 1, timeTo: 2 } });
  const utils = { timeOffset: 1 };
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, data, utils });

  mobileSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].time_from, 0);
  t.deepEqual(sessionsDownloaderCalls[0].time_to, 1);

  t.end();
});

test('fetch with day and year params passes them to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: { dayFrom: 3, dayTo: 4, yearFrom: 5, yearTo: 6 } });
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, data });

  mobileSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].day_from, 3);
  t.deepEqual(sessionsDownloaderCalls[0].day_to, 4);
  t.deepEqual(sessionsDownloaderCalls[0].year_from, 5);
  t.deepEqual(sessionsDownloaderCalls[0].year_to, 6);

  t.end();
});

test('fetch with tags and usernames params passes them to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ tags: "tag1, tag2", usernames: "will123, agata" });
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, data });

  mobileSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].tags, "tag1, tag2");
  t.deepEqual(sessionsDownloaderCalls[0].usernames, "will123, agata");

  t.end();
});

test('fetch with no time in params does not call downloadSessions', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: undefined });
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, data });

  mobileSessionsService._fetch();

  t.true(sessionsDownloaderCalls.length === 0);

  t.end();
});

test('fetch with time calls drawSession.clear', t => {
  const drawSession = mock('clear');
  const data = buildData({ time: {} });
  const mobileSessionsService = _mobileSessions({ data, drawSession });

  mobileSessionsService._fetch();

  t.true(drawSession.wasCalled());

  t.end();
});

test('fetch with time calls downloadSessions', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: {} });
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, data });

  mobileSessionsService._fetch();

  t.true(sessionsDownloaderCalls.length > 0);

  t.end();
});

test('fetch when on a different route than mobile map does not call downloadSessions', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: {} });
  const $window = { location: { href: '/other_route' } };
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, data, $window });

  mobileSessionsService._fetch();

  t.true(sessionsDownloaderCalls.length === 0);

  t.end();
});

test('fetch with limit checkbox selected passes map corner coordinates to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const map = {
    viewport: () => ({
      west: 1,
      east: 2,
      south: 3,
      north: 4
    })
  };
  const data = buildData({ location: { limit: true } });
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, map, data });

  mobileSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].west, 1);
  t.deepEqual(sessionsDownloaderCalls[0].east, 2);
  t.deepEqual(sessionsDownloaderCalls[0].south, 3);
  t.deepEqual(sessionsDownloaderCalls[0].north, 4);

  t.end();
});

test('fetch with limit checkbox selected and address passes map corner coordinates to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const map = {
    viewport: () => ({
      west: 1,
      east: 2,
      south: 3,
      north: 4
    })
  };
  const data = buildData({ location: { limit: true, address: 'new york' } });
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, map, data });

  mobileSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].west, 1);
  t.deepEqual(sessionsDownloaderCalls[0].east, 2);
  t.deepEqual(sessionsDownloaderCalls[0].south, 3);
  t.deepEqual(sessionsDownloaderCalls[0].north, 4);

  t.end();
});

test('fetch with address passes map corner coordinates to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const map = {
    viewport: () => ({
      west: 1,
      east: 2,
      south: 3,
      north: 4
    })
  };
  const data = buildData({ location: { address: 'new york' } });
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, map, data });

  mobileSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].west, 1);
  t.deepEqual(sessionsDownloaderCalls[0].east, 2);
  t.deepEqual(sessionsDownloaderCalls[0].south, 3);
  t.deepEqual(sessionsDownloaderCalls[0].north, 4);

  t.end();
});

test('fetch with limit checkbox unselected and no address does not pass map corner coordinates to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const map = {
    viewport: () => ({
      west: 1,
      east: 2,
      south: 3,
      north: 4
    })
  };
  const data = buildData();
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, map, data });

  mobileSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].west, undefined);
  t.deepEqual(sessionsDownloaderCalls[0].east, undefined);
  t.deepEqual(sessionsDownloaderCalls[0].south, undefined);
  t.deepEqual(sessionsDownloaderCalls[0].north, undefined);

  t.end();
});

test('selectSession after successfully fetching calls sessionsUtils.onSingleSessionFetch', t => {
  const sessionsUtils = mock('onSingleSessionFetch');
  const mobileSessionsService = _mobileSessions({ sessionsUtils, sensors: { sensors: { 123: { sensor_name: 'sensor_name' } } } });

  mobileSessionsService.selectSession(123);

  t.true(sessionsUtils.wasCalled());

  t.end();
});

test('selectSession after successfully fetching calls drawSession.drawMobileSession', t => {
  const drawSession = mock('drawMobileSession');
  const mobileSessionsService = _mobileSessions({ drawSession, sensors: { sensors: { 123: { sensor_name: 'sensor_name' } } } });

  mobileSessionsService.selectSession(123);

  t.true(drawSession.wasCalled());

  t.end();
});

const buildData = obj => ({ time: {}, location: {}, sensorId: 123, ...obj });

const _mobileSessions = ({ sessionsDownloaderCalls = [], data, drawSession, utils, sessionIds = [], $window = { location: { href: '/map_sessions' } }, map, sessionsUtils, sensors }) => {
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
  const _sensors = { selected: () => {}, sensors: {}, ...sensors };
  const _drawSession = drawSession || { clear: () => {} };
  const sessionsDownloader = (_, arg) => { sessionsDownloaderCalls.push(arg) };
  const _sessionsUtils = { find: () => ({}), allSelected: () => {}, onSingleSessionFetch: (x, y, callback) => callback(), ...sessionsUtils };
  const $http = { get: () => ({ success: callback => callback() }) };
  const boundsCalculator = () => {};

  return mobileSessions(params, $http, _map, _sensors, $rootScope, _utils, sessionsDownloader, _drawSession, boundsCalculator, _sessionsUtils, $window);
};

const mock = (name) => {
  let calls = [];

  return {
    [name]: arg => calls.push(arg),
    wasCalled: () => calls.length === 1,
    wasCalledWith: (arg) => deepEqual(arg, calls[calls.length - 1])
  };
};
