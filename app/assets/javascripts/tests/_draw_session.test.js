import test from 'blue-tape';
import { mock } from './helpers';
import { drawSession } from '../code/services/_draw_session';

test('drawMobileSession draws a session when session is loaded and sensor is selected', t => {
  const map = mock('drawMarker');
  const drawSessionStub = _drawSession({ map, sensors: selectedSensor });
  const callback = () => {};

  drawSessionStub.drawMobileSession(loadedSession, callback);

  t.true(map.wasCalled());

  t.end();
});

test('undoDraw removes all session elements from the map', t => {
  const map = mock('removeMarker');
  const session = { markers: [1], lines: [1], noteDrawings: [1] }
  const drawSessionStub = _drawSession({ map });

  drawSessionStub.undoDraw(session)

  t.true(map.wasCalledNTimes(3));
  t.deepEqual(session.markers, [])
  t.deepEqual(session.lines , [])
  t.deepEqual(session.noteDrawings, [])

  t.end();
});

const measurement = { value: 1, latitude: 2, longitude: 3 };
const selectedSensor = { anySelected: () => ({ sensor_name: "sensorName" })};
const loadedSession = {
  loaded: true,
  markers: [],
  lines: [],
  streams: { sensorName: { unit_symbol: "unit", measurements: [measurement]}}
};

const _drawSession = ({ map, sensors, heat }) => {
  const _map = { drawMarker: () => ({}), drawLine: () => ({}), ...map };
  const _heat = { getLevel: () => {}, outsideOfScope: () => false, ...heat };
  const _sensors = { selectedSensorName: () => "sensorName", ...sensors };
  return drawSession(_sensors, _map, _heat);
};
