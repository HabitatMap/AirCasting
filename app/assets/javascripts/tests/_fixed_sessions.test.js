import test from 'blue-tape';
import { mock } from './helpers';
import { fixedSessions } from '../code/services/_fixed_sessions';

test('fetch with no sessions ids in params passes empty array to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData();
  const sessionIds = [];
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls , data, sessionIds });

  fixedSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].session_ids, sessionIds);

  t.end();
});

test('fetch with sessions ids in params passes them to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData();
  const sessionIds = [1, 2, 3];
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data, sessionIds });

  fixedSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].session_ids, sessionIds);

  t.end();
});

test('fetch with time params passes them to sessionsDownloader after subtracting an offset from utils', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: { timeFrom: 1, timeTo: 2 } });
  const utils = { timeOffset: 1 };
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data, utils });

  fixedSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].time_from, 0);
  t.deepEqual(sessionsDownloaderCalls[0].time_to, 1);

  t.end();
});

test('fetch with day and year params passes them to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: { dayFrom: 3, dayTo: 4, yearFrom: 5, yearTo: 6 } });
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data });

  fixedSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].day_from, 3);
  t.deepEqual(sessionsDownloaderCalls[0].day_to, 4);
  t.deepEqual(sessionsDownloaderCalls[0].year_from, 5);
  t.deepEqual(sessionsDownloaderCalls[0].year_to, 6);

  t.end();
});

test('fetch with tags and usernames params passes them to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ tags: "tag1, tag2", usernames: "will123, agata" });
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data });

  fixedSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].tags, "tag1, tag2");
  t.deepEqual(sessionsDownloaderCalls[0].usernames, "will123, agata");

  t.end();
});

test('fetch with outdoorOnly set to true passes is_indoor false to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ location: { outdoorOnly: true, address: '' } });
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data });

  fixedSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].is_indoor, false);

  t.end();
});

test('fetch with outdoorOnly set to false does not pass is_indoor to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ location: { outdoorOnly: false, address: '' } });
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data });

  fixedSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].is_indoor, undefined);

  t.end();
});

test('fetch with no time in params does not call downloadSessions', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: undefined });
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data });

  fixedSessionsService._fetch();

  t.true(sessionsDownloaderCalls.length === 0);

  t.end();
});

test('fetch with time calls drawSession.clear', t => {
  const drawSession = mock('clear');
  const data = buildData({ time: {} });
  const fixedSessionsService = _fixedSessions({ data, drawSession });

  fixedSessionsService._fetch();

  t.true(drawSession.wasCalled());

  t.end();
});

test('fetch with time calls downloadSessions', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: {} });
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data });

  fixedSessionsService._fetch();

  t.true(sessionsDownloaderCalls.length > 0);

  t.end();
});

test('fetch when on a different route than fixed map does not call downloadSessions', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: {} });
  const $location = { path: () => '/other_route' };
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data, $location });

  fixedSessionsService._fetch();

  t.true(sessionsDownloaderCalls.length === 0);

  t.end();
});

test('fetch passes map corner coordinates to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const map = {
    getBounds: () => ({
      west: 1,
      east: 2,
      south: 3,
      north: 4
    })
  };
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, map });

  fixedSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].west, 1);
  t.deepEqual(sessionsDownloaderCalls[0].east, 2);
  t.deepEqual(sessionsDownloaderCalls[0].south, 3);
  t.deepEqual(sessionsDownloaderCalls[0].north, 4);

  t.end();
});

test('hasSelectedSessions with no selected sessions returns false', t => {
  const sessionsUtils = { noOfSelectedSessions: () => 0 };
  const fixedSessionsService = _fixedSessions({ sessionsUtils });

  const hasSelectedSessions = fixedSessionsService.hasSelectedSessions();

  t.false(hasSelectedSessions);

  t.end();
});

test('hasSelectedSessions with selected session returns true', t => {
  const sessionsUtils = { noOfSelectedSessions: () => 1 };
  const fixedSessionsService = _fixedSessions({ sessionsUtils });

  const hasSelectedSessions = fixedSessionsService.hasSelectedSessions();

  t.true(hasSelectedSessions);

  t.end();
});

const buildData = obj => ({ time: {}, location: {}, ...obj });

const _fixedSessions = ({ sessionsDownloaderCalls = [], data, drawSession, utils, sessionIds = [], $location, map, sessionsUtils }) => {
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
  const _map = map || { getBounds: () => ({}) };
  const _utils = utils || {};
  const sensors = { selected: () => {} };
  const _drawSession = drawSession || { clear: () => {} };
  const sessionsDownloader = (_, arg) => { sessionsDownloaderCalls.push(arg) };
  const _$location = $location || { path: () => '/map_fixed_sessions' };

  return fixedSessions(params, null, _map, sensors, $rootScope, _utils, sessionsDownloader, _drawSession, null, null, null, sessionsUtils, _$location);
};
