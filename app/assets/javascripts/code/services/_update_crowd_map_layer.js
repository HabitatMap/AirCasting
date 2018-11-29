import _ from 'underscore';

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

    $http.get('/api/averages', { cache: true, params: { q }})
      .error(onError(flash))
      .success(onAveragesFetch($location, map, params, utils));
  }
});

const onError = (flash) => () => flash.set('There was an error, sorry');

const onAveragesFetch = ($location, map, params, utils) => data => {
  if($location.path() !== "/map_sessions") return;
  const heats = utils.heats(params.get('data').heat)
  map.drawRectangles(data, heats, () => {});
};
