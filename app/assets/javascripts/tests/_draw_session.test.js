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

const _drawSession = ({ map, sensors, heat }) => {
  const _map = { drawMarker: () => ({}), ...map };
  const _heat = { getLevel: () => {}, ...heat };
  const _sensors = { ...sensors };
  return drawSession(_sensors, _map, _heat);
};
