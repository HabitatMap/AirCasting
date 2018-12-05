import _ from 'underscore';
import constants from '../constants';

export const updateCrowdMapLayer = (
  storage,
  map,
  $http,
  buildQueryParamsForAverages,
  flash,
  $location,
  params,
  utils,
  infoWindow,
  rectangles
) => ({
  call: (sessionIds) => {
    map.clearRectangles();
    if (!storage.isCrowdMapLayerOn()) return;

    const bounds = map.getBounds();
    const q = buildQueryParamsForAverages.call(sessionIds, bounds);
    if (!q) return;

    const _onRectangleClick = onRectangleClick(infoWindow, rectangles, sessionIds, buildQueryParamsForAverages);

    $http.get('/api/averages2', { cache: true, params: { q }})
      .error(onError(flash))
      .success(onAveragesFetch($location, map, params, utils, _onRectangleClick));
  }
});

const onError = (flash) => () => flash.set('There was an error, sorry');

const onAveragesFetch = ($location, map, params, utils, _onRectangleClick) => data => {
  if($location.path() !== constants.mobileMapRoute) return;
  const heats = utils.heats(params.get('data').heat)
  map.drawRectangles(data, heats, _onRectangleClick);
};

const onRectangleClick = (infoWindow, rectangles, sessionIds, buildQueryParamsForAverages) => rectangleData => {
  infoWindow.show("/api/region", buildQueryParamsForAverages.call(sessionIds, rectangleData), rectangles.position(rectangleData));
};
