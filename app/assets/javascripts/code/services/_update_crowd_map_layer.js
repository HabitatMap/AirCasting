import _ from 'underscore';
import constants from '../constants';

export const updateCrowdMapLayer = (
  storage,
  map,
  $http,
  buildQueryParamsForCrowdMapLayer,
  flash,
  params,
  utils,
  infoWindow,
  rectangles
) => ({
  call: (sessionIds, type) => {
    map.clearRectangles();
    if (!storage.isCrowdMapLayerOn()) return;

    const bounds = map.getBounds();
    const q = buildQueryParamsForCrowdMapLayer.call(sessionIds, bounds);
    if (!q) return;

    let _onRectangleClick;
    if (type === "Fixed") {
      _onRectangleClick = fixedOnRectangleClick(infoWindow, rectangles, sessionIds, buildQueryParamsForCrowdMapLayer);
    } else {
      _onRectangleClick = onRectangleClick(infoWindow, rectangles, sessionIds, buildQueryParamsForCrowdMapLayer);
    }


    $http.get('/api/averages', { cache: true, params: { q }})
      .error(onError(flash))
      .success(onAveragesFetch( map, params, utils, _onRectangleClick));
  }
});

const onError = (flash) => () => flash.set('There was an error, sorry');

const onAveragesFetch = (map, params, utils, _onRectangleClick) => data => {
  const heats = utils.heats(params.get('data').heat)
  map.drawRectangles(data, heats, _onRectangleClick);
};

const onRectangleClick = (infoWindow, rectangles, sessionIds, buildQueryParamsForCrowdMapLayer) => rectangleData => {
  infoWindow.show("/api/region", { q: buildQueryParamsForCrowdMapLayer.call(sessionIds, rectangleData) }, rectangles.position(rectangleData));
};

const fixedOnRectangleClick = (infoWindow, rectangles, sessionIds, buildQueryParamsForCrowdMapLayer) => rectangleData => {
  infoWindow.fixedShow("/api/region", { q: buildQueryParamsForCrowdMapLayer.call(sessionIds, rectangleData) }, rectangles.position(rectangleData));
};
