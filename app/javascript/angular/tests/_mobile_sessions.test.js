import test from "blue-tape";
import { mock } from "./helpers";
import { mobileSessionsTest } from "../code/services/_mobile_sessions";
import * as Clusterer from "../../javascript/clusterer";
import sinon from "sinon";

test("fetch with no sessions ids in params doesn't call sessionsDownloader", t => {
  const sessionsDownloaderCalls = [];
  const params = { isSessionSelected: () => true };
  const mobileSessionsService = _mobileSessions({
    sessionsDownloaderCalls,
    params
  });

  mobileSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls, []);

  t.end();
});

test("fetch with time params passes them to sessionsDownloader", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ timeFrom: 1, timeTo: 2 });
  const mobileSessionsService = _mobileSessions({
    sessionsDownloaderCalls,
    data
  });

  mobileSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls[0].time_from, 1);
  t.deepEqual(sessionsDownloaderCalls[0].time_to, 2);

  t.end();
});

test("fetch with tags and usernames params passes them to sessionsDownloader", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ tags: "tag1, tag2", usernames: "will123, agata" });
  const mobileSessionsService = _mobileSessions({
    sessionsDownloaderCalls,
    data
  });

  mobileSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls[0].tags, "tag1, tag2");
  t.deepEqual(sessionsDownloaderCalls[0].usernames, "will123, agata");

  t.end();
});

test("fetch with missing timeFrom value in params does not call downloadSessions", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ timeFrom: undefined });
  const mobileSessionsService = _mobileSessions({
    sessionsDownloaderCalls,
    data
  });

  mobileSessionsService.fetch();

  t.true(sessionsDownloaderCalls.length === 0);

  t.end();
});

test("fetch with missing timeTo value in params does not call downloadSessions", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ timeTo: undefined });
  const mobileSessionsService = _mobileSessions({
    sessionsDownloaderCalls,
    data
  });

  mobileSessionsService.fetch();

  t.true(sessionsDownloaderCalls.length === 0);

  t.end();
});

test("fetch with time calls downloadSessions", t => {
  const sessionsDownloaderCalls = [];
  const data = buildData({ time: {} });
  const mobileSessionsService = _mobileSessions({
    sessionsDownloaderCalls,
    data
  });

  mobileSessionsService.fetch();

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
  const mobileSessionsService = _mobileSessions({
    sessionsDownloaderCalls,
    map
  });

  mobileSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls[0].west, 1);
  t.deepEqual(sessionsDownloaderCalls[0].east, 2);
  t.deepEqual(sessionsDownloaderCalls[0].south, 3);
  t.deepEqual(sessionsDownloaderCalls[0].north, 4);

  t.end();
});

test("fetch called without arguments assigns default values", t => {
  const sessionsDownloaderCalls = [];
  const mobileSessionsService = _mobileSessions({
    sessionsDownloaderCalls
  });

  mobileSessionsService.fetch();

  t.deepEqual(sessionsDownloaderCalls[0].limit, 100);
  t.deepEqual(sessionsDownloaderCalls[0].offset, 0);

  t.end();
});

test("fetch called with values passes them to session downloader", t => {
  const sessionsDownloaderCalls = [];
  const mobileSessionsService = _mobileSessions({
    sessionsDownloaderCalls
  });

  mobileSessionsService.fetch({
    amount: 101,
    fetchedSessionsCount: 50
  });

  t.deepEqual(sessionsDownloaderCalls[0].limit, 101);
  t.deepEqual(sessionsDownloaderCalls[0].offset, 50);

  t.end();
});

test("fetch resets sessions list if offset equal 0", t => {
  const mobileSessionsService = _mobileSessions({});

  mobileSessionsService.fetch({
    fetchedSessionsCount: 0
  });

  t.deepEqual(mobileSessionsService.sessions, []);

  t.end();
});

test("fetch keeps the previous sessions list if offset does not equal 0", t => {
  const mobileSessionsService = _mobileSessions({});

  mobileSessionsService.sessions = ["someSession"];

  mobileSessionsService.fetch({
    fetchedSessionsCount: 50
  });

  t.deepEqual(mobileSessionsService.sessions, ["someSession"]);

  t.end();
});

test("selectSession after successfully fetching calls drawSession.drawMobileSession", t => {
  const drawSession = mock("drawMobileSession");
  const mobileSessionsService = _mobileSessions({
    drawSession,
    sensors: { sensors: { 123: { sensor_name: "sensor_name" } } }
  });

  mobileSessionsService.selectSession(123);

  t.true(drawSession.wasCalled());

  t.end();
});

test("selectSession calls drawSession.drawMobileSession with fetched data", t => {
  const drawSession = mock("drawMobileSession");
  const session = { id: 1, stream: {} };
  const mobileSessionsService = _mobileSessions({
    drawSession,
    sensors
  });

  mobileSessionsService.selectSession(session);

  t.true(drawSession.wasCalledWith(session));

  t.end();
});

test("selectSession after successfully fetching calls map.fitBoundsWithBottomPadding", t => {
  const map = mock("fitBoundsWithBottomPadding");
  const mobileSessionsService = _mobileSessions({
    map,
    sensors: { sensors: { 123: { sensor_name: "sensor_name" } } }
  });

  mobileSessionsService.selectSession(123);

  t.true(map.wasCalled());

  t.end();
});

test("when sensor is selected drawSessionsInLocation calls map.drawCustomMarker to draw marker with label", t => {
  const map = mock("drawMarkerWithLabel");
  const session = { streams: { sensorName: { unit_symbol: "unit" } } };
  const sensors = {
    anySelected: () => true,
    selectedSensorName: () => "sensorName"
  };

  const mobileSessionsService = _mobileSessions({
    map,
    sensors
  });
  mobileSessionsService.sessions = [session];

  mobileSessionsService.drawSessionsInLocation();

  t.true(map.wasCalled());

  t.end();
});

let clusterer;

test("when sensor is selected and sessions are located near each other drawSessionsInLocation calls map.drawCustomMarker to draw marker without label", t => {
  const map = mock("drawMarkerWithoutLabel");
  const session1 = {
    streams: {
      sensorName: { unit_symbol: "unit", start_latitude: 1, start_longitude: 1 }
    }
  };
  const session2 = {
    streams: {
      sensorName: { unit_symbol: "unit", start_latitude: 1, start_longitude: 1 }
    }
  };
  const sessions = [session1, session2];
  const sensors = {
    anySelected: () => true,
    selectedSensorName: () => "sensorName"
  };
  clusterer = sinon.stub(Clusterer, "clusterer").returns(sessions);

  const mobileSessionsService = _mobileSessions({
    map,
    sensors,
    clusterer
  });

  mobileSessionsService.drawSessionsInLocation();

  t.true(map.wasCalledNTimes(2));

  t.end();
});

test("teardown", t => {
  clusterer.restore();
  t.end();
});

test("redrawSelectedSession call drawSession.drawMobileSession with selected session data", t => {
  const drawSession = mock("drawMobileSession");
  const data = { id: 1 };

  const mobileSessionsService = _mobileSessions({ drawSession });
  mobileSessionsService.selectedSession = data;
  mobileSessionsService.redrawSelectedSession();

  t.true(drawSession.wasCalledWith(data));

  t.end();
});

const buildData = obj => ({
  timeFrom: 1,
  timeTo: 1,
  location: {},
  sensorId: 123,
  ...obj
});
const sensors = { sensors: { 123: { sensor_name: "sensor_name" } } };

const _mobileSessions = ({
  sessionsDownloaderCalls = [],
  data,
  drawSession,
  sessionIds = [],
  map,
  sensors,
  params
}) => {
  const $rootScope = { $new: () => ({}) };
  const _params = {
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
    isSessionSelected: () => false,
    selectedSessionId: () => 1,
    ...params
  };
  const _map = {
    getBounds: () => ({}),
    fitBounds: () => {},
    fitBoundsWithBottomPadding: () => {},
    getZoom: () => {},
    markers: [],
    ...map
  };
  const _sensors = {
    selectedId: () => 123,
    selected: () => {},
    sensors: {},
    anySelected: () => false,
    ...sensors
  };
  const _drawSession = {
    clear: () => {},
    drawMobileSession: () => {},
    ...drawSession
  };
  const sessionsDownloader = (_, arg) => {
    sessionsDownloaderCalls.push(arg);
  };
  const _heat = { levelName: () => "mid", outsideOfScope: () => false };

  return mobileSessionsTest(_heat, _sensors)(
    _params,
    _map,
    $rootScope,
    sessionsDownloader,
    _drawSession
  );
};
