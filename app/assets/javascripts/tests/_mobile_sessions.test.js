import test from 'blue-tape';
import { mock } from './helpers';
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
  const $location = { path: () => '/other_route' };
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, data, $location });

  mobileSessionsService._fetch();

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
  const mobileSessionsService = _mobileSessions({ sessionsDownloaderCalls, map });

  mobileSessionsService._fetch();

  t.deepEqual(sessionsDownloaderCalls[0].west, 1);
  t.deepEqual(sessionsDownloaderCalls[0].east, 2);
  t.deepEqual(sessionsDownloaderCalls[0].south, 3);
  t.deepEqual(sessionsDownloaderCalls[0].north, 4);

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

test('selectSession after successfully fetching calls map.fitBounds', t => {
  const map = mock('fitBounds');
  const mobileSessionsService = _mobileSessions({ map, sensors: { sensors: { 123: { sensor_name: 'sensor_name' } } } });

  mobileSessionsService.selectSession(123);

  t.true(map.wasCalled());

  t.end();
});

test('reSelectSession after successfully fetching calls sessionsUtils.onSingleSessionFetch', t => {
  const sessionsUtils = mock('onSingleSessionFetch');
  const mobileSessionsService = _mobileSessions({ sessionsUtils, sensors: { sensors: { 123: { sensor_name: 'sensor_name' } } } });

  mobileSessionsService.reSelectSession(123);

  t.true(sessionsUtils.wasCalled());

  t.end();
});

test('reSelectSession after successfully fetching calls drawSession.drawMobileSession', t => {
  const drawSession = mock('drawMobileSession');
  const mobileSessionsService = _mobileSessions({ drawSession, sensors: { sensors: { 123: { sensor_name: 'sensor_name' } } } });

  mobileSessionsService.reSelectSession(123);

  t.true(drawSession.wasCalled());

  t.end();
});

test('reSelectSession after successfully fetching does not call map.fitBounds', t => {
  const map = mock('fitBounds');
  const mobileSessionsService = _mobileSessions({ map, sensors: { sensors: { 123: { sensor_name: 'sensor_name' } } } });

  mobileSessionsService.reSelectSession(123);

  t.false(map.wasCalled());

  t.end();
});

test('deselectSession with existing session calls drawSession.undoDraw', t => {
  const drawSession = mock('undoDraw');
  const sessionsUtils = { find: () => ({ id: 1 }) };
  const mobileSessionsService = _mobileSessions({ drawSession, sessionsUtils });

  mobileSessionsService.deselectSession(1);

  t.true(drawSession.wasCalled());

  t.end();
});

test('deselectSession with non-existing session does not call drawSession.undoDraw', t => {
  const drawSession = mock('undoDraw');
  const sessionsUtils = { find: () => null };
  const mobileSessionsService = _mobileSessions({ drawSession, sessionsUtils });

  mobileSessionsService.deselectSession(1);

  t.false(drawSession.wasCalled());

  t.end();
});

test('deselectSession calls drawSession.undoDraw with the position saved before selecting the session', t => {
  const bounds = {
    east: -68.06802987730651,
    north: 47.98992183263727,
    south: 24.367113787533707,
    west: -123.65885018980651
  };
  const zoom = 10;
  const map = { getBounds: () => bounds, getZoom: () => zoom };
  const drawSession = mock('undoDraw');
  const sessionsUtils = { find: () => ({ id: 1 }) };
  const mobileSessionsService = _mobileSessions({ drawSession, sessionsUtils, map, sensors: { sensors: { 2: { sensor_name: 'sensor_name' } } } });
  mobileSessionsService.selectSession(1);

  mobileSessionsService.deselectSession(1);

  t.true(drawSession.wasCalledWith2({ bounds, zoom }));

  t.end();
});

test('deselectSession with no previously selected sessions calls drawSession.undoDraw with initial map position', t => {
  const bounds = {
    east: -68.06802987730651,
    north: 47.98992183263727,
    south: 24.367113787533707,
    west: -123.65885018980651
  };
  const zoom = 10;
  const drawSession = mock('undoDraw');
  const sessionsUtils = { find: () => ({ id: 1 }) };
  const mapPosition = { bounds, zoom };
  const map = { getBounds: () => bounds, getZoom: () => zoom };
  const mobileSessionsService = _mobileSessions({ drawSession, sessionsUtils, map });

  mobileSessionsService.deselectSession(1);

  t.true(drawSession.wasCalledWith2(mapPosition));

  t.end();
});

test('hasSelectedSessions with no selected sessions returns false', t => {
  const sessionsUtils = { noOfSelectedSessions: () => 0 };
  const mobileSessionsService = _mobileSessions({ sessionsUtils });

  const hasSelectedSessions = mobileSessionsService.hasSelectedSessions();

  t.false(hasSelectedSessions);

  t.end();
});

test('hasSelectedSessions with selected session returns true', t => {
  const sessionsUtils = { noOfSelectedSessions: () => 1 };
  const mobileSessionsService = _mobileSessions({ sessionsUtils });

  const hasSelectedSessions = mobileSessionsService.hasSelectedSessions();

  t.true(hasSelectedSessions);

  t.end();
});

test('drawSessionsInLocation calls drawSession.drawMobileSessionStartPoint', t => {
  const session = "session"
  const sessions = { session1: session }
  const sessionsUtils = { get: () => (sessions) };
  const drawSession = mock('drawMobileSessionStartPoint');
  const mobileSessionsService = _mobileSessions({ drawSession, sessionsUtils });

  mobileSessionsService.drawSessionsInLocation();

  t.true(drawSession.wasCalledWith(session));

  t.end();
});

const buildData = obj => ({ time: {}, location: {}, sensorId: 123, ...obj });

const _mobileSessions = ({ sessionsDownloaderCalls = [], data, drawSession, utils, sessionIds = [], $location, map, sessionsUtils, sensors }) => {
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
  const _map = { getBounds: () => ({}), fitBounds: () => {}, getZoom: () => {}, ...map };
  const _utils = utils || {};
  const _sensors = { selectedId: () => 123, selected: () => {}, sensors: {}, ...sensors };
  const _drawSession = { clear: () => {}, drawMobileSession: () => {}, ...drawSession };
  const sessionsDownloader = (_, arg) => { sessionsDownloaderCalls.push(arg) };
  const _sessionsUtils = { find: () => ({}), allSelected: () => {}, onSingleSessionFetch: (x, y, callback) => callback(), ...sessionsUtils };
  const $http = { get: () => ({ success: callback => callback() }) };
  const boundsCalculator = () => {};
  const _$location = $location || { path: () => '/map_sessions' };

  return mobileSessions(params, $http, _map, _sensors, $rootScope, _utils, sessionsDownloader, _drawSession, boundsCalculator, _sessionsUtils, _$location);
};
