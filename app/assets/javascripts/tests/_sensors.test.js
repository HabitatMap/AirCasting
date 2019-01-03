import test from 'blue-tape';
import { mock } from './helpers';
import {
  findAvailableSensorsForParameter,
  sort,
  defaultSensorIdForParameter,
  buildAvailableParameters
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
  const airbeamSensor1 = { session_count: 1, id: "Particulate Matter-AirBeam2-PM2.5 (µg/m³)" };
  const airbeamSensor2 = { session_count: 2, id: "Particulate Matter-AirBeam2-PM1 (µg/m³)" };
  const airbeamSensor3 = { session_count: 3, id: "Particulate Matter-AirBeam2-PM10 (µg/m³)" };
  const airbeamSensor4 = { session_count: 4, id: "Particulate Matter-AirBeam-PM (µg/m³)" };
  const otherSensor = { session_count: 5 };
  const sensors = [otherSensor, airbeamSensor4, airbeamSensor3, airbeamSensor2, airbeamSensor1];

  const actual = sort(sensors);

  const expected = [airbeamSensor1, airbeamSensor2, airbeamSensor3, airbeamSensor4, otherSensor];
  t.deepEqual(actual, expected);

  t.end();
});

test('sort when sorting humidity sensors it first puts AirBeams', t => {
  const airbeamSensor1 = { session_count: 1, id: "Humidity-AirBeam2-RH (%)" };
  const airbeamSensor2 = { session_count: 2, id: "Humidity-AirBeam-RH (%)" };
  const otherSensor = { session_count: 3 };
  const sensors = [otherSensor, airbeamSensor2, airbeamSensor1];

  const actual = sort(sensors);

  const expected = [airbeamSensor1, airbeamSensor2, otherSensor];
  t.deepEqual(actual, expected);

  t.end();
});

test('sort when sorting temperature sensors it first puts AirBeams', t => {
  const airbeamSensor1 = { session_count: 1, id: "Temperature-AirBeam2-F (F)" };
  const airbeamSensor2 = { session_count: 2, id: "Temperature-AirBeam-F (F)" };
  const otherSensor = { session_count: 3 };
  const sensors = [otherSensor, airbeamSensor2, airbeamSensor1];

  const actual = sort(sensors);

  const expected = [airbeamSensor1, airbeamSensor2, otherSensor];
  t.deepEqual(actual, expected);

  t.end();
});

test('sort when sorting sound level sensors it first puts Phone Microphone', t => {
  const phoneMicrophoneSensor = { session_count: 1, id: "Sound Level-Phone Microphone (dB)" };
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

  const expected = "Particulate Matter-AirBeam2-PM2.5 (µg/m³)";
  t.deepEqual(actual, expected);

  t.end();
});

test('defaultSensorIdForParameter returns hardcoded id for Humidity', t => {
  const sensors = [];
  const parameter = { id: "Humidity" };

  const actual = defaultSensorIdForParameter(parameter, sensors);

  const expected = "Humidity-AirBeam2-RH (%)";
  t.deepEqual(actual, expected);

  t.end();
});

test('defaultSensorIdForParameter returns hardcoded id for Temperature', t => {
  const sensors = [];
  const parameter = { id: "Temperature" };

  const actual = defaultSensorIdForParameter(parameter, sensors);

  const expected = "Temperature-AirBeam2-F (F)";
  t.deepEqual(actual, expected);

  t.end();
});

test('defaultSensorIdForParameter returns hardcoded id for Sound Level', t => {
  const sensors = [];
  const parameter = { id: "Sound Level" };

  const actual = defaultSensorIdForParameter(parameter, sensors);

  const expected = "Sound Level-Phone Microphone (dB)";
  t.deepEqual(actual, expected);

  t.end();
});

test('buildAvailableParameters builds available parameters sorted by session_count with all as first', t => {
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
    { label: "All", id: "all" },
    { label: "Humidity", id: "Humidity" },
    { label: "Particulate Matter", id: "Particulate Matter" }
  ];
  t.deepEqual(actual, expected);

  t.end();
});
