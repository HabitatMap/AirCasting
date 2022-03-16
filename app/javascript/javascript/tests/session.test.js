import test from "blue-tape";
import * as Session from "../session";

test("when title is missing it defaults to unnamed", (t) => {
  const session = { stream: {} };

  const actual = Session.formatSessionForList(session);

  t.deepEqual(actual.title, "unnamed");

  t.end();
});

test("when title is present it uses it", (t) => {
  const title = "walk to the park";
  const session = {
    title,
    stream: {},
  };

  const actual = Session.formatSessionForList(session);

  t.deepEqual(actual.title, title);

  t.end();
});

test("when returns a username", (t) => {
  const username = "user1234";
  const session = {
    username,
    stream: {},
  };

  const actual = Session.formatSessionForList(session);

  t.deepEqual(actual.username, username);

  t.end();
});

test("roundedAverage returns session rounded average for selected stream", (t) => {
  const session = { stream: { average_value: 1.1 } };
  const actual = Session.roundedAverage(session);

  t.deepEqual(actual, 1);

  t.end();
});

test("lastMeasurementRoundedValue returns the last measurement rounded value", (t) => {
  const session = { last_measurement_value: 1.1 };
  const actual = Session.lastMeasurementRoundedValue(session);

  t.deepEqual(actual, 1);

  t.end();
});

test("startingLatLng returns starting latitude and longitude of selected sensor", (t) => {
  const session = { stream: { start_latitude: 1, start_longitude: 2 }};
  const actual = Session.startingLatLng(session);
  const expected = { lat: () => 1, lng: () => 2 };

  t.deepEqual(actual.lat(), expected.lat());
  t.deepEqual(actual.lng(), expected.lng());

  t.end();
});

test("latLng returns latitude and longitude of the session", (t) => {
  const session = { latitude: 1, longitude: 2 };
  const actual = Session.latLng(session);
  const expected = { lat: () => 1, lng: () => 2 };

  t.deepEqual(actual.lat(), expected.lat());
  t.deepEqual(actual.lng(), expected.lng());

  t.end();
});

test("averageValueAndUnit returns rounded session average value and unit for the selected sensor", (t) => {
  const session = { stream: { unit_symbol: "dB", average_value: 1.2 } };
  const actual = Session.averageValueAndUnit(session);

  t.deepEqual(actual, "1 dB");

  t.end();
});

test("lastMeasurementValueAndUnit returns the rounded last measurement value and unit for the selected sensor", (t) => {
  const session = {
    last_measurement_value: 1.2,
    stream: { unit_symbol: "dB" },
  };
  const actual = Session.lastMeasurementValueAndUnit(session);

  t.deepEqual(actual, "1 dB");

  t.end();
});
