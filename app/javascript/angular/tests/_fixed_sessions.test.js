import test from "blue-tape";
import { mock } from "./helpers";
import {
  fixedSessions,
  showClusterInfo
} from "../code/services/_fixed_sessions";
import sinon from "sinon";

test("fetch with no sessions ids in params doesn't call sessionsDownloader", t => {
  const sessionsDownloaderCalls = [];
  const sessionsUtils = { isSessionSelected: () => true };
  const fixedSessionsService = _fixedSessions({
    sessionsDownloaderCalls,
    sessionsUtils
  });

  fixedSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls, []);

  t.end();
});

test("fetch with time params passes them to sessionsDownloader", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ timeFrom: 1, timeTo: 2 });
  const fixedSessionsService = _fixedSessions({
    sessionsDownloaderCalls,
    data
  });

  fixedSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls[0].time_from, 1);
  t.deepEqual(sessionsDownloaderCalls[0].time_to, 2);

  t.end();
});

test("fetch with tags and usernames params passes them to sessionsDownloader", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ tags: "tag1, tag2", usernames: "will123, agata" });
  const fixedSessionsService = _fixedSessions({
    sessionsDownloaderCalls,
    data
  });

  fixedSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls[0].tags, "tag1, tag2");
  t.deepEqual(sessionsDownloaderCalls[0].usernames, "will123, agata");

  t.end();
});

test("fetch with isIndoor set to true passes is_indoor true to sessionsDownloader", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ isIndoor: true });
  const fixedSessionsService = _fixedSessions({
    sessionsDownloaderCalls,
    data
  });

  fixedSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls[0].is_indoor, true);

  t.end();
});

test("fetch with isIndoor set to true does not pass map corner coordinates to sessionsDownloader", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ isIndoor: true });
  const map = {
    getBounds: () => ({
      west: 1,
      east: 2,
      south: 3,
      north: 4
    })
  };
  const fixedSessionsService = _fixedSessions({
    sessionsDownloaderCalls,
    data,
    map
  });

  fixedSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls[0].west, undefined);
  t.deepEqual(sessionsDownloaderCalls[0].east, undefined);
  t.deepEqual(sessionsDownloaderCalls[0].south, undefined);
  t.deepEqual(sessionsDownloaderCalls[0].north, undefined);

  t.end();
});

test("fetch with isIndoor set to false does not pass is_indoor to sessionsDownloader", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ isIndoor: false });
  const fixedSessionsService = _fixedSessions({
    sessionsDownloaderCalls,
    data
  });

  fixedSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls[0].is_indoor, undefined);

  t.end();
});

test("fetch with missing timeFrom value in params does not call downloadSessions", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ timeFrom: undefined });
  const fixedSessionsService = _fixedSessions({
    sessionsDownloaderCalls,
    data
  });

  fixedSessionsService.fetch();

  t.true(sessionsDownloaderCalls.length === 0);

  t.end();
});

test("fetch with missing timeTo value in params does not call downloadSessions", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ timeTo: undefined });
  const fixedSessionsService = _fixedSessions({
    sessionsDownloaderCalls,
    data
  });

  fixedSessionsService.fetch();

  t.true(sessionsDownloaderCalls.length === 0);

  t.end();
});

test("fetch with time calls drawSession.clear", t => {
  const drawSession = mock("clear");
  const data = buildData({ time: {} });
  const fixedSessionsService = _fixedSessions({ data, drawSession });

  fixedSessionsService.fetch();

  t.true(drawSession.wasCalled());

  t.end();
});

test("fetch with time calls downloadSessions", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: {} });
  const fixedSessionsService = _fixedSessions({
    sessionsDownloaderCalls,
    data
  });

  fixedSessionsService.fetch();

  t.true(sessionsDownloaderCalls.length > 0);

  t.end();
});

test("fetch passes map corner coordinates to sessionsDownloader", t => {
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

  fixedSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls[0].west, 1);
  t.deepEqual(sessionsDownloaderCalls[0].east, 2);
  t.deepEqual(sessionsDownloaderCalls[0].south, 3);
  t.deepEqual(sessionsDownloaderCalls[0].north, 4);

  t.end();
});

test("selectSession with outdoor session after successfully fetching calls map.fitBoundsWithBottomPadding", t => {
  const map = mock("fitBoundsWithBottomPadding");
  const $http = {
    get: () => ({
      success: callback => callback({ is_indoor: false, streams: {} })
    })
  };
  const sensors = { sensors: { 123: { sensor_name: "sensor_name" } } };
  const fixedSessionsService = _fixedSessions({ map, $http, sensors });

  fixedSessionsService.selectSession(123);

  t.true(map.wasCalled());

  t.end();
});

test("selectSession with indoor session after successfully fetching does not call map.fitBounds", t => {
  const map = mock("fitBounds");
  const sessionsUtils = { selectedSession: () => ({ is_indoor: true }) };
  const sensors = { sensors: { 123: { sensor_name: "sensor_name" } } };
  const fixedSessionsService = _fixedSessions({ map, sessionsUtils, sensors });

  fixedSessionsService.selectSession(123);

  t.false(map.wasCalled());

  t.end();
});

test("deselectSession with existing session calls drawSession.undoDraw", t => {
  const drawSession = mock("undoDraw");
  const sessionsUtils = { isSessionSelected: () => true };
  const fixedSessionsService = _fixedSessions({ drawSession, sessionsUtils });

  fixedSessionsService.deselectSession(1);

  t.true(drawSession.wasCalled());

  t.end();
});

test("deselectSession with non-existing session does not call drawSession.undoDraw", t => {
  const drawSession = mock("undoDraw");
  const sessionsUtils = { isSessionSelected: () => false };
  const fixedSessionsService = _fixedSessions({ drawSession, sessionsUtils });

  fixedSessionsService.deselectSession(1);

  t.false(drawSession.wasCalled());

  t.end();
});

test("deselectSession calls undoDraw with the bounds saved before selecting the session", t => {
  const drawSession = mock("undoDraw");
  const bounds = {
    east: -68.06802987730651,
    north: 47.98992183263727,
    south: 24.367113787533707,
    west: -123.65885018980651
  };
  const zoom = 10;
  const map = {
    getBounds: () => bounds,
    getZoom: () => zoom,
    ...mock("fitBounds")
  };
  const sessionsUtils = {
    isSessionSelected: () => true
  };
  const sensors = {
    sensors: { 1: { sensor_name: "sensor_name" } },
    selectedId: () => 1
  };
  const fixedSessionsService = _fixedSessions({
    drawSession,
    map,
    sessionsUtils,
    sensors
  });
  fixedSessionsService.selectSession(1);

  fixedSessionsService.deselectSession(1);

  t.true(drawSession.wasCalledWith2({ bounds: bounds, zoom: zoom }));

  t.end();
});

test("drawSessionsInLocation doesnt draw markers for indoor sessions", t => {
  const map = mock("drawCustomMarker");
  const session = { latitude: 1, longitude: 1 };
  const data = buildData({ isIndoor: true });

  const fixedSessionsService = _fixedSessions({ data, map });
  fixedSessionsService.sessions = [session];

  fixedSessionsService.drawSessionsInLocation();

  t.false(map.wasCalled());

  t.end();
});

test("drawSessionsInLocation draws default marker when no sensor selected", t => {
  const map = mock("drawMarkerWithoutLabel");
  const session = { latitude: 1, longitude: 2 };
  const sensors = { anySelected: () => false };

  const fixedSessionsService = _fixedSessions({ map, sensors });
  fixedSessionsService.sessions = [session];

  fixedSessionsService.drawSessionsInLocation();

  t.true(map.wasCalledWithObjIncluding({ colorClass: "default" }));

  t.end();
});

test("drawSessionsInLocation draws default marker for sessions that are not streaming currently", t => {
  const map = mock("drawMarkerWithoutLabel");
  const session = { latitude: 1, longitude: 2 };
  const data = buildData({ isStreaming: false });

  const fixedSessionsService = _fixedSessions({ data, map });
  fixedSessionsService.sessions = [session];

  fixedSessionsService.drawSessionsInLocation();

  t.true(map.wasCalledWithObjIncluding({ colorClass: "default" }));

  t.end();
});

test("drawSessionsInLocation draws colorcoded marker for currently streaming sessions when sensor selected", t => {
  const map = mock("drawMarkerWithLabel");
  const session = {
    id: 123,
    latitude: 1,
    longitude: 2,
    last_hour_average: 1.1,
    streams: { sensorName: { unit_symbol: "unit" } }
  };
  const sensors = {
    anySelected: () => true,
    selectedSensorName: () => "sensorName"
  };
  const data = buildData({ isStreaming: true });

  const fixedSessionsService = _fixedSessions({ data, map, sensors });
  fixedSessionsService.sessions = [session];

  fixedSessionsService.drawSessionsInLocation();

  t.true(map.wasCalledWithObjIncluding({ colorClass: "mid" }));

  t.end();
});

test("drawSessionsInLocation calls map.clusterMarkers for currently streaming sessions when sensor selected", t => {
  const clusterMarkers = sinon.spy();
  const map = { clusterMarkers };
  const sensors = { anySelected: () => true };
  const data = buildData({ isStreaming: true });
  const fixedSessionsService = _fixedSessions({ data, map, sensors });

  fixedSessionsService.drawSessionsInLocation();

  sinon.assert.called(clusterMarkers);

  t.end();
});

test("drawSessionsInLocation removes previous markers", t => {
  const removeAllMarkers = sinon.spy();
  const map = { removeAllMarkers };
  const fixedSessionsService = _fixedSessions({ map });

  fixedSessionsService.drawSessionsInLocation();

  sinon.assert.called(removeAllMarkers);

  t.end();
});

test("showClusterInfo returns a callback that calls setSelectedCluster with current cluster", t => {
  const setSelectedCluster = sinon.spy();
  const cluster = { getMarkers: () => [], getCenter: () => {} };
  const callback = showClusterInfo(
    "",
    { setSelectedCluster },
    { show: () => {} }
  );

  callback(cluster);

  sinon.assert.calledWith(setSelectedCluster, cluster);

  t.end();
});

test("showClusterInfo returns a callback that calls infoWindow.show with correct sessions ids and sensor name", t => {
  const show = sinon.spy();
  const infoWindow = { show };
  const cluster = {
    getMarkers: () => [{ objectId: () => 1 }],
    getCenter: () => {}
  };
  const callback = showClusterInfo(
    "Sensor Name",
    { setSelectedCluster: () => {} },
    infoWindow
  );

  callback(cluster);

  sinon.assert.calledWith(show, "/api/fixed_region", {
    q: { session_ids: [1], sensor_name: "Sensor Name" }
  });

  t.end();
});

const buildData = obj => ({
  timeFrom: 1,
  timeTo: 1,
  location: {},
  sensorId: 123,
  ...obj
});

const _fixedSessions = ({
  sessionsDownloaderCalls = [],
  data,
  drawSession,
  sessionIds = [],
  map,
  sessionsUtils,
  sensors,
  $http
}) => {
  const $rootScope = { $new: () => ({}) };
  const params = {
    get: what => {
      if (what === "data") {
        return data || buildData();
      } else if (what == "prevMapPosition") {
        return {};
      } else {
        throw new Error(`unexpected param ${what}`);
      }
    },
    update: () => {},
    selectedSessionIds: () => sessionIds,
    isStreaming: () => false
  };
  const _map = {
    getBounds: () => ({}),
    getZoom: () => undefined,
    markers: [],
    drawCustomMarker: () => {},
    removeAllMarkers: () => {},
    clusterMarkers: () => {},
    drawMarkerWithoutLabel: () => {},
    fitBoundsWithBottomPadding: () => {},
    ...map
  };
  const _sensors = {
    selectedId: () => 123,
    selected: () => {},
    sensors: {},
    anySelected: () => false,
    selectedSensorName: () => "sensorName",
    ...sensors
  };
  const _drawSession = drawSession || { clear: () => {}, undoDraw: () => {} };
  const sessionsDownloader = (_, arg) => {
    sessionsDownloaderCalls.push(arg);
  };
  const _sessionsUtils = {
    find: () => ({}),
    get: self => self.sessions,
    isSessionSelected: () => false,
    selectedSession: () => {},
    selectedSessionId: () => 1,
    ...sessionsUtils
  };
  const _$http = {
    get: () => ({ success: callback => callback({ streams: {} }) }),
    ...$http
  };
  const _heat = { levelName: () => "mid", outsideOfScope: () => false };

  return fixedSessions(
    params,
    _$http,
    _map,
    _sensors,
    $rootScope,
    sessionsDownloader,
    _drawSession,
    _sessionsUtils,
    null,
    _heat
  );
};
