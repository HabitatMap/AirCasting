import test from "blue-tape";
import * as Session from "../../javascript/session";

test("when title is missing it defaults to unnamed", t => {
  const session = { selectedStream: {} };

  const actual = Session.formatSessionForList(session);

  t.deepEqual(actual.title, "unnamed");

  t.end();
});

test("when title is present it uses it", t => {
  const title = "walk to the park";
  const session = {
    title,
    selectedStream: {}
  };

  const actual = Session.formatSessionForList(session);

  t.deepEqual(actual.title, title);

  t.end();
});

test("when returns a username", t => {
  const username = "user1234";
  const session = {
    username,
    selectedStream: {}
  };

  const actual = Session.formatSessionForList(session);

  t.deepEqual(actual.username, username);

  t.end();
});

test("roundedAverage returns session rounded average for selected stream", t => {
  const selectedSensor = "selectedSensor";
  const session = { streams: { selectedSensor: { average_value: 1.1 } } };
  const actual = Session.roundedAverage(session, selectedSensor);

  t.deepEqual(actual, 1);

  t.end();
});

test("lastHourRoundedAverage returns session last hour rounded average", t => {
  const session = { last_hour_average: 1.1 };
  const actual = Session.lastHourRoundedAverage(session);

  t.deepEqual(actual, 1);

  t.end();
});

test("id returns session id", t => {
  const session = { id: 1 };
  const actual = Session.id(session);

  t.deepEqual(actual, 1);

  t.end();
});

test("startingLatLng returns starting latitude and longitude of selected sensor", t => {
  const selectedSensor = "selectedSensor";
  const session = {
    streams: { selectedSensor: { start_latitude: 1, start_longitude: 2 } }
  };
  const actual = Session.startingLatLng(session, selectedSensor);
  const expected = { lat: () => 1, lng: () => 2 };

  t.deepEqual(actual.lat(), expected.lat());
  t.deepEqual(actual.lng(), expected.lng());

  t.end();
});

test("latLng returns latitude and longitude of the session", t => {
  const session = { latitude: 1, longitude: 2 };
  const actual = Session.latLng(session);
  const expected = { lat: () => 1, lng: () => 2 };

  t.deepEqual(actual.lat(), expected.lat());
  t.deepEqual(actual.lng(), expected.lng());

  t.end();
});

test("averageValueAndUnit returns rounded session average value and unit for selected sensor", t => {
  const selectedSensor = "selectedSensor";
  const session = {
    streams: { selectedSensor: { unit_symbol: "dB", average_value: 1.2 } }
  };
  const actual = Session.averageValueAndUnit(session, selectedSensor);

  t.deepEqual(actual, "1 dB");

  t.end();
});

test("lastHourAverageValueAndUnit returns rounded session last hour average value and unit for selected sensor", t => {
  const selectedSensor = "selectedSensor";
  const session = {
    last_hour_average: 1.2,
    streams: { selectedSensor: { unit_symbol: "dB" } }
  };
  const actual = Session.lastHourAverageValueAndUnit(session, selectedSensor);

  t.deepEqual(actual, "1 dB");

  t.end();
});
