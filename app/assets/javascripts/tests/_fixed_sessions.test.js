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

test('fetch with indoorOnly set to true passes is_indoor true to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ location: { indoorOnly: true } });
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data });

  fixedSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].is_indoor, true);

  t.end();
});

test('fetch with indoorOnly set to true does not pass map corner coordinates to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ location: { indoorOnly: true } });
  const map = {
    getBounds: () => ({
      west: 1,
      east: 2,
      south: 3,
      north: 4
    })
  };
  const fixedSessionsService = _fixedSessions({ sessionsDownloaderCalls, data, map });

  fixedSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].west, undefined);
  t.deepEqual(sessionsDownloaderCalls[0].east, undefined);
  t.deepEqual(sessionsDownloaderCalls[0].south, undefined);
  t.deepEqual(sessionsDownloaderCalls[0].north, undefined);

  t.end();
});

test('fetch with indoorOnly set to false does not pass is_indoor to sessionsDownloader', t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ location: { indoorOnly: false } });
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

test('selectSession with indoor session after successfully fetching calls map.fitBounds', t => {
  const map = mock('fitBounds');
  const sessionsUtils = { find: () => ({ is_indoor: false }) };
  const sensors = { sensors: { 123: { sensor_name: 'sensor_name' } } };
  const fixedSessionsService = _fixedSessions({ map, sessionsUtils, sensors });

  fixedSessionsService.selectSession(123);

  t.true(map.wasCalled());

  t.end();
});

test('selectSession with outdoor session after successfully fetching does not call map.fitBounds', t => {
  const map = mock('fitBounds');
  const sessionsUtils = { find: () => ({ is_indoor: true }) };
  const sensors = { sensors: { 123: { sensor_name: 'sensor_name' } } };
  const fixedSessionsService = _fixedSessions({ map, sessionsUtils, sensors });

  fixedSessionsService.selectSession(123);

  t.false(map.wasCalled());

  t.end();
});

test('deselectSession with existing session calls fitBounds', t => {
  const map = mock('fitBounds');
  const sessionsUtils = { find: () => ({ id: 1 }) };
  const fixedSessionsService = _fixedSessions({ map, sessionsUtils });

  fixedSessionsService.deselectSession(1);

  t.true(map.wasCalled());

  t.end();
});

test('deselectSession with non-existing session does not call drawSession.undoDraw', t => {
  const map = mock('fitBounds');
  const sessionsUtils = { find: () => null };
  const fixedSessionsService = _fixedSessions({ map, sessionsUtils });

  fixedSessionsService.deselectSession(1);

  t.false(map.wasCalled());

  t.end();
});

test('deselectSession calls fitBounds with the bounds saved before selecting the session', t => {
  const bounds = {
    east: -68.06802987730651,
    north: 47.98992183263727,
    south: 24.367113787533707,
    west: -123.65885018980651
  };
  const zoom = 10;
  const map = { getBounds: () => bounds, getZoom: () => zoom, ...mock('fitBounds') };
  const sessionsUtils = { find: () => ({ id: 1 }) };
  const sensors = { sensors: { 1: { sensor_name: 'sensor_name' } } };
  const fixedSessionsService = _fixedSessions({ map, sessionsUtils, sensors });
  fixedSessionsService.selectSession(1);

  fixedSessionsService.deselectSession(1);

  t.true(map.wasCalledWith(bounds));
  t.true(map.wasCalledWith2(zoom));

  t.end();
});

test('deselectSession with no previously selected sessions calls fitBounds with initial map position', t => {
  const bounds = {
    east: -68.06802987730651,
    north: 47.98992183263727,
    south: 24.367113787533707,
    west: -123.65885018980651
  };
  const zoom = 10;
  const sessionsUtils = { find: () => ({ id: 1 }) };
  const mapPosition = { bounds, zoom };
  const map = { getBounds: () => bounds, getZoom: () => zoom, ...mock('fitBounds') };
  const fixedSessionsService = _fixedSessions({ map, sessionsUtils });

  fixedSessionsService.deselectSession(1);

  t.true(map.wasCalledWith(mapPosition.bounds));
  t.true(map.wasCalledWith2(mapPosition.zoom));

  t.end();
});

const buildData = obj => ({ time: {}, location: {}, sensorId: 123, ...obj });

const _fixedSessions = ({ sessionsDownloaderCalls = [], data, drawSession, utils, sessionIds = [], $location, map, sessionsUtils, sensors }) => {
  const $rootScope = { $new: () => ({}) };
  const params = {
    get: what => {
      if (what === "data") {
        return data || buildData();
      } else if (what === "selectedSessionIds") {
        return sessionIds || [];
      } else {
        throw new Error(`unexpected param ${what}`);
      }
    }
  };
  const _map = { getBounds: () => ({}), getZoom: () => undefined, ...map };
  const _utils = utils || {};
  const _sensors = { selected: () => {}, sensors: {}, ...sensors };
  const _drawSession = drawSession || { clear: () => {} };
  const sessionsDownloader = (_, arg) => { sessionsDownloaderCalls.push(arg) };
  const _$location = $location || { path: () => '/map_fixed_sessions' };
  const _sessionsUtils = { find: () => ({}), allSelected: () => {}, onSingleSessionFetch: (x, y, callback) => callback(), ...sessionsUtils };
  const $http = { get: () => ({ success: callback => callback() }) };
  const boundsCalculator = () => {};

  return fixedSessions(params, $http, _map, _sensors, $rootScope, _utils, sessionsDownloader, _drawSession, boundsCalculator, _sessionsUtils, _$location);
};
