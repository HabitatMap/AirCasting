import test from 'blue-tape';
import * as Session from '../code/values/session';

test('when title is missing it defaults to unnamed', t => {
  const session = {};

  const actual = Session.formatSessionForList(session);

  t.deepEqual(actual.title, 'unnamed');

  t.end();
});

test('when title is present it uses it', t => {
  const title = 'walk to the park';
  const session = {
    title
  };

  const actual = Session.formatSessionForList(session);

  t.deepEqual(actual.title, title);

  t.end();
});

test('when session is indoor it uses anonymous as username', t => {
  const session = {
    is_indoor: true
  };

  const actual = Session.formatSessionForList(session);

  t.deepEqual(actual.username, 'anonymous');

  t.end();
});

test('when session is outdoor it uses its username', t => {
  const username = 'user1234';
  const session = {
    is_indoor: false,
    username
  };

  const actual = Session.formatSessionForList(session);

  t.deepEqual(actual.username, username);

  t.end();
});

test('average returns session average', t => {
  const session = { average: 1 };
  const actual = Session.average(session);

  t.deepEqual(actual, 1);

  t.end();
});

test('lastHourAverage returns session last hour average', t => {
  const session = { last_hour_average: 1 };
  const actual = Session.lastHourAverage(session);

  t.deepEqual(actual, 1);

  t.end();
});

test('id returns session id', t => {
  const session = { id: 1 };
  const actual = Session.id(session);

  t.deepEqual(actual, 1);

  t.end();
});

test('startingLatLng returns starting latitude and longitude of selected sensor', t => {
  const selectedSensor = "selectedSensor"
  const session = { streams: { selectedSensor: { start_latitude: 1, start_longitude: 2 } } };
  const actual = Session.startingLatLng(session, selectedSensor);
  const expected = { lat: () => 1, lng: () => 2 }

  t.deepEqual(actual.lat(), expected.lat());
  t.deepEqual(actual.lng(), expected.lng());

  t.end();
});

test('latLng returns latitude and longitude of the session', t => {
  const session = { latitude: 1, longitude: 2 };
  const actual = Session.latLng(session);
  const expected = { lat: () => 1, lng: () => 2 }

  t.deepEqual(actual.lat(), expected.lat());
  t.deepEqual(actual.lng(), expected.lng());

  t.end();
});

test('averageVauleAndUnit returns rounded session average value and unit for selected sensor', t => {
  const selectedSensor = "selectedSensor"
  const session = { average: 1.2, streams: { selectedSensor: { unit_symbol: "dB" } } };
  const actual = Session.averageVauleAndUnit(session, selectedSensor);

  t.deepEqual(actual, "1 dB");

  t.end();
});

test('lastHourAverageVauleAndUnit returns rounded session last hour average value and unit for selected sensor', t => {
  const selectedSensor = "selectedSensor"
  const session = { last_hour_average: 1.2, streams: { selectedSensor: { unit_symbol: "dB" } } };
  const actual = Session.lastHourAverageVauleAndUnit(session, selectedSensor);

  t.deepEqual(actual, "1 dB");

  t.end();
});
