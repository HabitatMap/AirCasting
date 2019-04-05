import test from 'blue-tape';
import { mock } from './helpers';
import sinon from 'sinon';
import {
  sensors
} from '../code/services/_sensors';

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
    id: 'particulate matter-airbeam2-pm2.5 (µg/m³)',
    label: 'AirBeam2-PM2.5 (µg/m³)',
    select_label: 'AirBeam2-PM2.5 (µg/m³)'
  };
  t.deepEqual(actual, expected);

  t.end();
});

test('selected with sensor id in the url returns the correct sensor with added id, label, select_label', t => {
  const params = {
    get: () => ({ sensorId: "humidity-airbeam2-rh (%)" })
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
    id: 'humidity-airbeam2-rh (%)',
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

  const expected = 'particulate matter-airbeam2-pm2.5 (µg/m³)';
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
