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
  const drawSessionMock = _drawSession({map});

  drawSessionMock.drawMobileSessionStartPoint(session, selectedSensor);

  t.true(map.wasCalled());

  t.end();
});

const _drawSession = ({ map }) => {
  const _map = { ...map };
  const _heat = { getLevel: () => {} };
  return drawSession(null, _map, _heat);
};
