import test from 'blue-tape';
import { mock } from './helpers';
import { drawSession } from '../code/services/_draw_session';

test('clearOtherSessions removes all markers expect the selected one', t => {
  const map = mock('removeMarker');
  const selected_session = { drawed: true, markers: ["selected session marker"] };
  const other_session = { drawed: true, markers: ["other session marker"] }
  const sessions = [other_session, selected_session];
  const drawSessionMock = _drawSession({ map });

  drawSessionMock.clearOtherSessions(sessions, selected_session);

  t.true(map.wasCalledWith("other session marker"));

  t.end();
});


test('drawMobileSessionStartPoint calls drawMarker', t => {
  const map = mock('drawMarker');
  const selectedSensor = "sensorId";
  const streams = { sensorId: {} };
  const session = { streams: streams, markers: [] };
  const drawSessionMock = _drawSession({ map });

  drawSessionMock.drawMobileSessionStartPoint(session, selectedSensor);

  t.true(map.wasCalled());

  t.end();
});

test('drawFixedSession creates a marker if heat level is not null', t => {
  const marker = {};
  const heat = { getLevel: () => 1 }
  const drawSessionMock = _drawSession({ heat });
  const session = { last_hour_average: 1 };

  const actual = drawSessionMock.drawFixedSession(session);

  const expected = [marker]
  t.deepEqual(actual, expected);

  t.end();
})

test('drawFixedSession does not create a marker if heat level is null', t => {
  const drawSessionMock = _drawSession({});
  const session = { last_hour_average: 1 };

  const actual = drawSessionMock.drawFixedSession(session);

  const expected = []
  t.deepEqual(actual, expected  );

  t.end();
})

const _drawSession = ({ map, sensors, heat }) => {
  const _map = { drawMarker: () => { return {}}, ...map };
  const _heat = { getLevel: () => {}, ...heat };
  const _sensors = { anySelected: () => true , tmpSelected: () => false, ...sensors };
  return drawSession(_sensors, _map, _heat);
};
