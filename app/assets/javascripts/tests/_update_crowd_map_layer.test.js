import test from 'blue-tape';
import { mock } from './helpers';
import { updateCrowdMapLayer } from '../code/services/_update_crowd_map_layer';

test('when crowd map layer is off it clears rectangles', t => {
  const storage = { isCrowdMapLayerOn: () => false };
  const map = mock('clearRectangles');
  const service = _updateCrowdMapLayer({ storage, map });

  service.call()

  t.true(map.wasCalled());

  t.end();
});

test('when the request for the averages fails it flashes an error', t => {
  const flash = mock('set');
  const $http = mockHttp({ shouldFail: true });
  const service = _updateCrowdMapLayer({ $http, flash });

  service.call();

  t.true(flash.wasCalledWith('There was an error, sorry'));

  t.end();
});

test('when the request for the averages succeeds but the app is not on the mobile tab it does not delegate to map.drawRectangles', t => {
  const map = {
    clearRectangles: () => {},
    ...mock('drawRectangles')
  };
  const $http = mockHttp({ shouldFail: false });
  const $location = { path: () => "/not_mobile_tab" };
  const service = _updateCrowdMapLayer({ map, $http, $location });

  service.call();

  t.false(map.wasCalled());

  t.end();
});

test('when the request for the averages succeeds and the app is on the mobile tab it delegates to map.drawRectangles', t => {
  const map = {
    clearRectangles: () => {},
    ...mock('drawRectangles')
  };
  const $http = mockHttp({ shouldFail: false });
  const $location = { path: () => "/map_sessions" };
  const service = _updateCrowdMapLayer({ map, $http, $location });

  service.call();

  t.true(map.wasCalled());

  t.end();
});

test('when buildQueryParamsForAverages return false it does not request the averages', t => {
  const buildQueryParamsForAverages = { call: () => false };
  const $http = mock('get');
  const service = _updateCrowdMapLayer({ $http, buildQueryParamsForAverages });

  service.call();

  t.false($http.wasCalled());

  t.end();
});

const mockHttp = ({ shouldFail }) => {
  const success = callback => {
    shouldFail ? null : callback();
    return { error: x => x };
  };
  const error = callback => {
    shouldFail ? callback() : null;
    return { success };
  };
  const get = { error, success };
  return {
    get: () => get
  };
};

const _updateCrowdMapLayer = ({ storage, map, $http, flash, buildQueryParamsForAverages, $location }) => {
  const _storage = {
    isCrowdMapLayerOn: () => true,
    ...storage
  };
  const _map = {
    clearRectangles: () => {},
    ...map
  };
  const _buildQueryParamsForAverages = {
    call: () => ({}),
    ...buildQueryParamsForAverages
  };
  const params = {
    get: () => ({})
  };
  const utils = {
    heats: x => x
  };

  return updateCrowdMapLayer(_storage, _map, $http, _buildQueryParamsForAverages, flash, $location, params, utils);
};
