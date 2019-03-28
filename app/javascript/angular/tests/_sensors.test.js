import test from 'blue-tape';
import { mock } from './helpers';
import sinon from 'sinon';
import {
  findAvailableSensorsForParameter,
  sort,
  defaultSensorIdForParameter,
  buildAvailableParameters,
  sensors
} from '../code/services/_sensors';

test('findAvailableSensorsForParameter when parameter is falsy it returns sensors sorted with passed function', t => {
  const sensor1 = { id: 1 };
  const sensor2 = { id: 2 };
  const sensors = { sensor1, sensor2 };
  const revert = sensors => sensors.reverse();
  const parameter = false;

  const actual = findAvailableSensorsForParameter(revert, sensors, parameter);

  const expected = [sensor2, sensor1];
  t.deepEqual(actual, expected);

  t.end();
});

test('findAvailableSensorsForParameter filters sensors by parameter id', t => {
  const id = 'id';
  const sensor1 = { measurement_type: id };
  const sensor2 = { measurement_type: 'different' };
  const sensors = { sensor1, sensor2 };
  const parameter = { id };

  const actual = findAvailableSensorsForParameter(x => x, sensors, parameter);

  const expected = [sensor1];
  t.deepEqual(actual, expected);

  t.end();
});

test('sort sorts sensors by session_count descending', t => {
  const sensor1 = { session_count: 2 };
  const sensor2 = { session_count: 1 };
  const sensors = [sensor2, sensor1];

  const actual = sort(sensors, {});

  const expected = [sensor1, sensor2];
  t.deepEqual(actual, expected);

  t.end();
});

test('sort when sorting particulate matter sensors it first puts AirBeams', t => {
  const airbeamSensor1 = { session_count: 1, id: "Particulate Matter-airbeam2-pm2.5 (µg/m³)" };
  const airbeamSensor2 = { session_count: 2, id: "Particulate Matter-airbeam2-pm1 (µg/m³)" };
  const airbeamSensor3 = { session_count: 3, id: "Particulate Matter-airbeam2-pm10 (µg/m³)" };
  const airbeamSensor4 = { session_count: 4, id: "Particulate Matter-airbeam-pm (µg/m³)" };
  const otherSensor = { session_count: 5 };
  const sensors = [otherSensor, airbeamSensor4, airbeamSensor3, airbeamSensor2, airbeamSensor1];

  const actual = sort(sensors);

  const expected = [airbeamSensor1, airbeamSensor2, airbeamSensor3, airbeamSensor4, otherSensor];
  t.deepEqual(actual, expected);

  t.end();
});

test('sort when sorting humidity sensors it first puts AirBeams', t => {
  const airbeamSensor1 = { session_count: 1, id: "Humidity-airbeam2-rh (%)" };
  const airbeamSensor2 = { session_count: 2, id: "Humidity-airbeam-rh (%)" };
  const otherSensor = { session_count: 3 };
  const sensors = [otherSensor, airbeamSensor2, airbeamSensor1];

  const actual = sort(sensors);

  const expected = [airbeamSensor1, airbeamSensor2, otherSensor];
  t.deepEqual(actual, expected);

  t.end();
});

test('sort when sorting temperature sensors it first puts AirBeams', t => {
  const airbeamSensor1 = { session_count: 1, id: "Temperature-airbeam2-f (F)" };
  const airbeamSensor2 = { session_count: 2, id: "Temperature-airbeam-f (F)" };
  const otherSensor = { session_count: 3 };
  const sensors = [otherSensor, airbeamSensor2, airbeamSensor1];

  const actual = sort(sensors);

  const expected = [airbeamSensor1, airbeamSensor2, otherSensor];
  t.deepEqual(actual, expected);

  t.end();
});

test('sort when sorting sound level sensors it first puts Phone Microphone', t => {
  const phoneMicrophoneSensor = { session_count: 1, id: "Sound Level-phone microphone (dB)" };
  const otherSensor = { session_count: 2 };
  const sensors = [otherSensor, phoneMicrophoneSensor];

  const actual = sort(sensors);

  const expected = [phoneMicrophoneSensor, otherSensor];
  t.deepEqual(actual, expected);

  t.end();
});

test('defaultSensorIdForParameter returns the id of the one with the biggest session_count', t => {
  const sensor1 = { id: 1, session_count: 1 };
  const sensor2 = { id: 2, session_count: 2 };
  const sensors = [sensor1, sensor2];
  const parameter = {};

  const actual = defaultSensorIdForParameter(parameter, sensors);

  const expected = sensor2.id;
  t.deepEqual(actual, expected);

  t.end();
});

test('defaultSensorIdForParameter returns hardcoded id for Particulate Matter', t => {
  const sensors = [];
  const parameter = { id: "Particulate Matter" };

  const actual = defaultSensorIdForParameter(parameter, sensors);

  const expected = "Particulate Matter-airbeam2-pm2.5 (µg/m³)";
  t.deepEqual(actual, expected);

  t.end();
});

test('defaultSensorIdForParameter returns hardcoded id for Humidity', t => {
  const sensors = [];
  const parameter = { id: "Humidity" };

  const actual = defaultSensorIdForParameter(parameter, sensors);

  const expected = "Humidity-airbeam2-rh (%)";
  t.deepEqual(actual, expected);

  t.end();
});

test('defaultSensorIdForParameter returns hardcoded id for Temperature', t => {
  const sensors = [];
  const parameter = { id: "Temperature" };

  const actual = defaultSensorIdForParameter(parameter, sensors);

  const expected = "Temperature-airbeam2-f (F)";
  t.deepEqual(actual, expected);

  t.end();
});

test('defaultSensorIdForParameter returns hardcoded id for Sound Level', t => {
  const sensors = [];
  const parameter = { id: "Sound Level" };

  const actual = defaultSensorIdForParameter(parameter, sensors);

  const expected = "Sound Level-phone microphone (dB)";
  t.deepEqual(actual, expected);

  t.end();
});

test('buildAvailableParameters builds available parameters sorted by session_count', t => {
  const sensors = {
    "a": {
      measurement_type: "Particulate Matter",
      session_count: 1
    },
    "b": {
      measurement_type: "Humidity",
      session_count: 2
    }
  }

  const actual = buildAvailableParameters(sensors);

  const expected = [
    { label: "Humidity", id: "Humidity" },
    { label: "Particulate Matter", id: "Particulate Matter" }
  ];
  t.deepEqual(actual, expected);

  t.end();
});

test('selected with no sensor id in the url returns the default sensor with added id, label, select_label', t => {
  const params = {
    get: () => ({ sensorId: null })
  };
  const service = _sensors({ params })
  const defaultSensor = {
    measurement_type: "Particulate Matter",
    sensor_name: "AirBeam2-PM2.5",
    unit_symbol: "µg/m³"
  };
  const allSensors = [defaultSensor];
  service.setSensors(allSensors)

  const actual = service.selected();

  const expected = {
    ...defaultSensor,
    id: 'Particulate Matter-airbeam2-pm2.5 (µg/m³)',
    label: 'AirBeam2-PM2.5 (µg/m³)',
    select_label: 'AirBeam2-PM2.5 (µg/m³)'
  };
  t.deepEqual(actual, expected);

  t.end();
});

test('selected with sensor id in the url returns the correct sensor with added id, label, select_label', t => {
  const params = {
    get: () => ({ sensorId: "Humidity-airbeam2-rh (%)" })
  };
  const service = _sensors({ params })
  const sensor = {
    measurement_type: "Humidity",
    sensor_name:      "AirBeam2-RH",
    unit_symbol:      "%"
  };
  const allSensors = [sensor];
  service.setSensors(allSensors)

  const actual = service.selected();

  const expected = {
    ...sensor,
    id: 'Humidity-airbeam2-rh (%)',
    label: 'AirBeam2-RH (%)',
    select_label: 'AirBeam2-RH (%)'
  };
  t.deepEqual(actual, expected);

  t.end();
});

test('selectedId with no sensor id in the url returns the default sensor id', t => {
  const params = {
    get: () => ({ sensorId: null })
  };
  const service = _sensors({ params })
  const defaultSensor = {
    measurement_type: "Particulate Matter",
    sensor_name: "AirBeam2-PM2.5",
    unit_symbol: "µg/m³"
  };
  const allSensors = [defaultSensor];
  service.setSensors(allSensors)

  const actual = service.selectedId();

  const expected = 'Particulate Matter-airbeam2-pm2.5 (µg/m³)';
  t.deepEqual(actual, expected);

  t.end();
});

test('selectedId with sensor id in the url returns the correct sensor id', t => {
  const params = {
    get: () => ({ sensorId: "Humidity-airbeam2-rh (%)" })
  };
  const service = _sensors({ params })
  const sensor = {
    measurement_type: "Humidity",
    sensor_name:      "AirBeam2-RH",
    unit_symbol:      "%"
  };
  const allSensors = [sensor];
  service.setSensors(allSensors)

  const actual = service.selectedId();

  const expected = 'Humidity-airbeam2-rh (%)';
  t.deepEqual(actual, expected);

  t.end();
});

test('when passed a falsy param as sensor fetchHeatLevelsForSensor does not do anything', t => {
  const $http = sinon.spy();
  const sensor = false;
  const service = _sensors({ $http })

  const actual = service.fetchHeatLevelsForSensor(sensor);

  t.false($http.called);

  t.end();
});

test('fetchHeatLevelsForSensor calls callback after fetching thresholds', t => {
  const sensor = {};
  const thresholds = { ts: 123 };
  const parsedThresholds = { parsed: 234 };
  const heat = { parse: sinon.stub().withArgs(thresholds).returns(parsedThresholds) };
  const $http = {
    get: () => ({
      success: cb => cb(thresholds)
    })
  };
  const storage = { updateDefaults: sinon.spy() };
  const params = { update: sinon.spy() };
  const service = _sensors({ $http, params, storage, heat })

  const actual = service.fetchHeatLevelsForSensor(sensor);

  t.true(storage.updateDefaults.calledWith({ heat: parsedThresholds }));
  t.true(params.update.calledWith({ data: { heat: parsedThresholds }}));

  t.end();
});

const _sensors = ({ params, $http, storage, heat }) => {
  const _$http = { ...$http };
  const _storage = { ...storage };
  const _params = {
    get: () => ({ sensorId: null }),
    update: () => {},
    ...params
  };
  const _heat = { ...heat }

  return sensors(_params, _storage, _heat, _$http);
};
