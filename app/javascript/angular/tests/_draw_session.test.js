import test from "blue-tape";
import { mock } from "./helpers";
import { drawSession } from "../code/services/_draw_session.js";

test("undoDraw removes all session markers", t => {
  const marker = mock("setMap");
  const session = {
    markers: [marker]
  };
  const drawSessionStub = _drawSession({});

  drawSessionStub.undoDraw(session);

  t.true(marker.wasCalled());
  t.deepEqual(session.markers, []);

  t.end();
});

const measurement = { value: 1, latitude: 2, longitude: 3 };
const selectedSensor = { anySelected: () => ({ sensor_name: "sensorName" }) };
const loadedSession = {
  markers: [],
  lines: [],
  streams: { sensorName: { unit_symbol: "unit", measurements: [measurement] } }
};

const _drawSession = ({ map, sensors, heat }) => {
  const _map = { drawMarker: () => ({}), drawLine: () => ({}), ...map };
  const _heat = { getLevel: () => {}, outsideOfScope: () => false, ...heat };
  const _sensors = { selectedSensorName: () => "sensorName", ...sensors };
  return drawSession(_sensors, _map, _heat);
};
