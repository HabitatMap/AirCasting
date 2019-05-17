import test from "blue-tape";
import { mock } from "./helpers";
import sinon from "sinon";
import { sensors } from "../code/services/_sensors";

test("selected with no sensor id in the url returns the default sensor with added id, label, select_label", t => {
  const params = {
    get: () => ({ sensorId: null })
  };
  const service = _sensors({ params });
  const defaultSensor = {
    measurement_type: "Particulate Matter",
    sensor_name: "AirBeam2-PM2.5",
    unit_symbol: "µg/m³"
  };
  const allSensors = [defaultSensor];
  service.setSensors(allSensors);

  const actual = service.selected();

  const expected = {
    ...defaultSensor,
    id: "Particulate Matter-airbeam2-pm2.5 (µg/m³)",
    label: "AirBeam2-PM2.5 (µg/m³)",
    select_label: "AirBeam2-PM2.5 (µg/m³)"
  };
  t.deepEqual(actual, expected);

  t.end();
});

test("selected with sensor id in the url returns the correct sensor with added id, label, select_label", t => {
  const params = {
    get: () => ({ sensorId: "Humidity-airbeam2-rh (%)" })
  };
  const service = _sensors({ params });
  const sensor = {
    measurement_type: "Humidity",
    sensor_name: "AirBeam2-RH",
    unit_symbol: "%"
  };
  const allSensors = [sensor];
  service.setSensors(allSensors);

  const actual = service.selected();

  const expected = {
    ...sensor,
    id: "Humidity-airbeam2-rh (%)",
    label: "AirBeam2-RH (%)",
    select_label: "AirBeam2-RH (%)"
  };
  t.deepEqual(actual, expected);

  t.end();
});

test("selectedId with no sensor id in the url returns the default sensor id", t => {
  const params = {
    get: () => ({ sensorId: null })
  };
  const service = _sensors({ params });
  const defaultSensor = {
    measurement_type: "Particulate Matter",
    sensor_name: "AirBeam2-PM2.5",
    unit_symbol: "µg/m³"
  };
  const allSensors = [defaultSensor];
  service.setSensors(allSensors);

  const actual = service.selectedId();

  const expected = "Particulate Matter-airbeam2-pm2.5 (µg/m³)";
  t.deepEqual(actual, expected);

  t.end();
});

test("selectedId with sensor id in the url returns the correct sensor id", t => {
  const params = {
    get: () => ({ sensorId: "Humidity-airbeam2-rh (%)" })
  };
  const service = _sensors({ params });
  const sensor = {
    measurement_type: "Humidity",
    sensor_name: "AirBeam2-RH",
    unit_symbol: "%"
  };
  const allSensors = [sensor];
  service.setSensors(allSensors);

  const actual = service.selectedId();

  const expected = "Humidity-airbeam2-rh (%)";
  t.deepEqual(actual, expected);

  t.end();
});

const _sensors = ({ params, $http, heat }) => {
  const _$http = { ...$http };
  const _params = {
    get: () => ({ sensorId: null }),
    update: () => {},
    ...params
  };
  const _heat = { ...heat };

  return sensors(_params, _heat, _$http);
};
