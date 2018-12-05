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
  utils
) => ({
  call: (sessionIds) => {
    map.clearRectangles();
    if (!storage.isCrowdMapLayerOn()) return;

    const q = buildQueryParamsForAverages.call(sessionIds);
    if (!q) return;

    $http.get('/api/averages2', { cache: true, params: { q }})
      .error(onError(flash))
      .success(onAveragesFetch($location, map, params, utils));
  }
});

const onError = (flash) => () => flash.set('There was an error, sorry');

const onAveragesFetch = ($location, map, params, utils) => data => {
  if($location.path() !== constants.mobileMapRoute) return;
  const heats = utils.heats(params.get('data').heat)
  map.drawRectangles(data, heats, () => {});
};
