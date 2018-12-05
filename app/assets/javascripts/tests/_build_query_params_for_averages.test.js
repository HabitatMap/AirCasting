import test from 'blue-tape';
import { mock } from './helpers';
import { buildQueryParamsForAverages } from '../code/services/_build_query_params_for_averages';

test('when no sensor is selected it returns false', t => {
  const sensors = {
    selected: () => false
  };
  const service = _buildQueryParamsForAverages({ sensors });

  const actual = service.call();

  t.false(actual);

  t.end();
});

test('when one coordinate is missing in bounds it returns false', t => {
  const map = {
    getBounds: () => ({ west: null, east: 2, north: 3, south: 4 })
  };
  const service = _buildQueryParamsForAverages({ map });

  const actual = service.call();

  t.false(actual);

  t.end();
});

test('when time is missing in params it returns false', t => {
  const params = {
    get: () => ({
      heat: {},
      gridResolution: 123
    })
  };
  const service = _buildQueryParamsForAverages({ params });

  const actual = service.call();

  t.false(actual);

  t.end();
});

test('when heat is missing in params it returns false', t => {
  const params = {
    get: () => ({
      time: {},
      gridResolution: 123
    })
  };
  const service = _buildQueryParamsForAverages({ params });

  const actual = service.call();

  t.false(actual);

  t.end();
});

test('when gridResolution is missing in params it returns false', t => {
  const params = {
    get: () => ({
      time: {},
      heat: {}
    })
  };
  const service = _buildQueryParamsForAverages({ params });

  const actual = service.call();

  t.false(actual);

  t.end();
});

test('when everything is present it returns params for averages', t => {
  const sensor_name = "sensor_name";
  const measurement_type = "measurement_type";
  const unit_symbol = "unit_symbol";
  const sensors = {
    selected: () => ({ sensor_name, measurement_type, unit_symbol })
  };
  const west = 1;
  const east = 2;
  const north = 3;
  const south = 4;
  const map = {
    getBounds: () => ({ west, east, north, south })
  };
  const timeFrom = 5;
  const timeTo = 6;
  const dayFrom = 7;
  const dayTo = 8;
  const yearFrom = 9;
  const yearTo = 10;
  const gridResolution = 11;
  const tags = [1];
  const usernames = [2];
  const params = {
    get: () => ({
      time: { timeFrom, timeTo, dayFrom, dayTo, yearFrom, yearTo },
      heat: {},
      gridResolution,
      tags,
      usernames
    })
  };
  const grid_size_x = 12;
  const utils = {
    normalizeTime: x => x,
    gridSizeX: x => grid_size_x
  };
  const service = buildQueryParamsForAverages(map, sensors, params, utils);
  const sessionIds = [3, 4];

  const actual = service.call(sessionIds);

  const grid_size_y = gridResolution;
  const session_ids = sessionIds;
  const expected = {
    west,
    east,
    south,
    north,
    time_from: timeFrom,
    time_to: timeTo,
    day_from: dayFrom,
    day_to: dayTo,
    year_from: yearFrom,
    year_to: yearTo,
    grid_size_x,
    grid_size_y,
    tags,
    usernames,
    sensor_name,
    measurement_type,
    unit_symbol,
    session_ids
  };
  t.deepEqual(actual, expected);

  t.end();
});

const _buildQueryParamsForAverages = ({ sensors, map, params }) => {
  const sensor_name = "sensor_name";
  const measurement_type = "measurement_type";
  const unit_symbol = "unit_symbol";
  const _sensors = {
    selected: () => ({ sensor_name, measurement_type, unit_symbol }),
    ...sensors
  };
  const west = 1;
  const east = 2;
  const north = 3;
  const south = 4;
  const _map = {
    getBounds: () => ({ west, east, north, south }),
    ...map
  };
  const timeFrom = 5;
  const timeTo = 6;
  const dayFrom = 7;
  const dayTo = 8;
  const yearFrom = 9;
  const yearTo = 10;
  const gridResolution = 11;
  const tags = [1];
  const usernames = [2];
  const _params = {
    get: () => ({
      time: { timeFrom, timeTo, dayFrom, dayTo, yearFrom, yearTo },
      heat: {},
      gridResolution,
      tags,
      usernames
    }),
    ...params
  };
  const grid_size_x = 12;
  const utils = {
    normalizeTime: x => x,
    gridSizeX: x => grid_size_x
  };

  return buildQueryParamsForAverages(_map, _sensors, _params, utils);
};
