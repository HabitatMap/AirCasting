import test from 'blue-tape';
import { mock } from './helpers';
import { MobileSessionsMapCtrl } from '../code/controllers/_mobile_sessions_map_ctrl';
import moment from 'moment'

test('it shows by default sensor and heat legend', t => {
  const shown = [];
  const expandables = {
    show: name => shown.push(name)
  };

  _MobileSessionsMapCtrl({ expandables });

  t.deepEqual(shown, ['sensor', 'heatLegend']);

  t.end();
});

test('it updates defaults', t => {
  let defaults = {};
  const sensorId = "sensor id";
  const params = {
    get: () => ({ sensorId }),
    updateFromDefaults: opts => defaults = opts
  };

  _MobileSessionsMapCtrl({ params });

  const expected = {
    sensorId,
    location: "",
    tags: "",
    usernames: "",
    gridResolution: 25,
    crowdMap: false,
    timeFrom: moment().utc().startOf('day').subtract(1, 'year').format('X'),
    timeTo: moment().utc().endOf('day').format('X')
  };
  t.deepEqual(defaults, expected);

  t.end();
});

test('fetches heat levels on first opening map tab', t => {
  const sensors = mock('fetchHeatLevels');
  _MobileSessionsMapCtrl({ sensors });

  t.true(sensors.wasCalled())

  t.end();
});

test('does not fetch heat levels if they are already in the params', t => {
  const sensors = mock('fetchHeatLevels');
  const params = { get: () => ({ heat: {}})};
  _MobileSessionsMapCtrl({ sensors, params });

  t.false(sensors.wasCalled())

  t.end();
});

const _MobileSessionsMapCtrl = ({ $scope, map, callback, expandables, sensors, params }) => {
  const _expandables = { show: () => {}, ...expandables };
  const _sensors = { setSensors: () => {}, fetchHeatLevels: () => {}, ...sensors };
  const functionBlocker = { block: () => {} };
  const _params = { get: () => ({}), updateFromDefaults: () => {}, ...params };
  const infoWindow = { hide: () => {} };
  const _map = {
    goToAddress: () => {},
    unregisterAll: () => {},
    removeAllMarkers: () => {},
    clearRectangles: () => {},
    ...map
  };
  const _$scope = { $watch: () => {}, ...$scope };

  return MobileSessionsMapCtrl(_$scope, _params, _map, _sensors, _expandables, null, null, null, null, null, functionBlocker, null, infoWindow);
};
