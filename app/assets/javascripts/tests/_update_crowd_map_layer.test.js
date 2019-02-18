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

test('it delegates building the query param to a service passing it the session ids', t => {
  const calls = [];
  const buildQueryParamsForCrowdMapLayer = {
    call: arg => { calls.push(arg); return false },
    wasCalledWith: arg => calls[calls.length - 1] === arg
  };
  const service = _updateCrowdMapLayer({ buildQueryParamsForCrowdMapLayer });
  const sessionIds = [1, 2];

  service.call(sessionIds);

  t.true(buildQueryParamsForCrowdMapLayer.wasCalledWith(sessionIds));

  t.end();
});

test('when the request for the averages succeeds it delegates to map.drawRectangles', t => {
  const map = {
    clearRectangles: () => {},
    ...mock('drawRectangles')
  };
  const $http = mockHttp({ shouldFail: false });
  const service = _updateCrowdMapLayer({ map, $http });

  service.call();

  t.true(map.wasCalled());

  t.end();
});

test('when buildQueryParamsForCrowdMapLayer return false it does not request the averages', t => {
  const buildQueryParamsForCrowdMapLayer = { call: () => false };
  const $http = mock('get');
  const service = _updateCrowdMapLayer({ $http, buildQueryParamsForCrowdMapLayer });

  service.call();

  t.false($http.wasCalled());

  t.end();
});

test('when the request for the averages succeeds it passes a callback to drawRectangles', t => {
  const map = {
    clearRectangles: () => {},
    drawRectangles: (_a, _b, callback) => { callback() }
  };
  const $http = mockHttp({ shouldFail: false });
  const rectangles ={
    position: () => {}
  };
  const infoWindow = mock('show');
  const service = _updateCrowdMapLayer({ map, $http, infoWindow, rectangles });

  service.call();

  t.true(infoWindow.wasCalled());

  t.end();
});

test('when the request for the averages succeeds it passes a callback to drawRectangles with query params for averages', t => {
  const map = {
    clearRectangles: () => {},
    drawRectangles: (_a, _b, callback) => { callback() }
  };
  const $http = mockHttp({ shouldFail: false });
  const infoWindow = mock('show');
  const queryParamsForAverages = {};
  const buildQueryParamsForCrowdMapLayer = {
    call: () => queryParamsForAverages
  };
  const service = _updateCrowdMapLayer({ map, $http, buildQueryParamsForCrowdMapLayer, infoWindow });

  service.call();

  t.true(infoWindow.wasCalledWith2({ q: queryParamsForAverages }));

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

const _updateCrowdMapLayer = ({ storage, map, $http, flash, buildQueryParamsForCrowdMapLayer, infoWindow, rectangles }) => {
  const _storage = {
    isCrowdMapLayerOn: () => true,
    ...storage
  };
  const _map = {
    clearRectangles: () => {},
    getBounds: () => {},
    ...map
  };
  const _buildQueryParamsForCrowdMapLayer = {
    call: () => ({}),
    ...buildQueryParamsForCrowdMapLayer
  };
  const params = {
    get: () => ({})
  };
  const utils = {
    heats: x => x
  };
  const _rectangles = {
    position: () => {}
  };

  return updateCrowdMapLayer(_storage, _map, $http, _buildQueryParamsForCrowdMapLayer, flash, params, utils, infoWindow, _rectangles);
};
