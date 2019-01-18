import test from 'blue-tape';
import { mock } from './helpers';
import { drawSession } from '../code/services/_draw_session';

test('clearOtherSessions removes all markers expect the selected one', t => {
  const map = mock('removeMarker');
  const selected_session = { drawed: true, markers: ["selected session marker"] };
  const other_session = { drawed: true, markers: ["other session marker"] }
  const sessions = [other_session, selected_session];
  const drawSessionStub = _drawSession({ map });

  drawSessionStub.clearOtherSessions(sessions, selected_session);

  t.true(map.wasCalledWith("other session marker"));

  t.end();
});


test('drawMobileSessionStartPoint calls drawMarker', t => {
  const map = mock('drawMarker');
  const selectedSensor = "sensorId";
  const streams = { sensorId: {} };
  const session = { streams: streams, markers: [] };
  const drawSessionStub = _drawSession({ map });

  drawSessionStub.drawMobileSessionStartPoint(session, selectedSensor);

  t.true(map.wasCalled());

  t.end();
});

test('with all sensors selected drawFixedSession creates a marker', t => {
  const marker = {};
  const sensors = { selected: () => false }
  const session = {};
  const drawSessionStub = _drawSession({ sensors });

  const actual = drawSessionStub.drawFixedSession(session);

  const expected = [marker]
  t.deepEqual(actual, expected);

  t.end();
})

test('with sensor selected and last_hour_average is undefined drawFixedSession creates a marker', t => {
  const marker = {};
  const sensors = { selected: () => true }
  const session = {};
  const drawSessionStub = _drawSession({ sensors });

  const actual = drawSessionStub.drawFixedSession(session);

  const expected = [marker]
  t.deepEqual(actual, expected);

  t.end();
})

test('with selected sensor and last_hour_average outsied of scope drawFixedSession does not create a marker', t => {
  const sensors = { selected: () => true }
  const session = { last_hour_average: -1 };
  const heat = { outsideOfScope: () => true };
  const drawSessionStub = _drawSession({ sensors, heat });

  const actual = drawSessionStub.drawFixedSession(session);

  const expected = []
  t.deepEqual(actual, expected);

  t.end();
})

test('with selected sensor and last_hour_average defined and inside scope drawFixedSession creates a marker', t => {
  const marker = {};
  const sensors = { selected: () => true }
  const session = { last_hour_average: 1 };
  const heat = { outsideOfScope: () => false, getLevel: () => 1 }
  const drawSessionStub = _drawSession({ sensors, heat });

  const actual = drawSessionStub.drawFixedSession(session);

  const expected = [marker]
  t.deepEqual(actual, expected);

  t.end();
})


const _drawSession = ({ map, sensors, heat }) => {
  const _map = { drawMarker: () => ({}), ...map };
  const _heat = { getLevel: () => {}, ...heat };
  const _sensors = { ...sensors };
  return drawSession(_sensors, _map, _heat);
};
