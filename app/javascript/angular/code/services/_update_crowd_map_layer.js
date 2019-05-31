import _ from "underscore";
import constants from "../../../javascript/constants";

export const updateCrowdMapLayer = (
  map,
  $http,
  buildQueryParamsForCrowdMapLayer,
  flash,
  params,
  utils,
  infoWindow,
  rectangles,
  $window
) => ({
  call: sessionIds => {
    map.clearRectangles();
    if (!params.isCrowdMapOn()) return;

    const bounds = map.getBounds();
    const q = buildQueryParamsForCrowdMapLayer.call(sessionIds, bounds);
    if (!q) return;

    const _onRectangleClick = onRectangleClick(
      infoWindow,
      rectangles,
      sessionIds,
      buildQueryParamsForCrowdMapLayer
    );

    $http
      .get("/api/averages", { cache: true, params: { q } })
      .error(onError(flash))
      .success(onAveragesFetch($window, map, params, utils, _onRectangleClick));
  }
});

const onError = flash => () => flash.set("There was an error, sorry");

const onAveragesFetch = (
  $window,
  map,
  params,
  utils,
  _onRectangleClick
) => data => {
  if ($window.location.pathname !== constants.mobileMapRoute) return;
  const heats = utils.heats(params.get("data").heat);
  map.drawRectangles(data, heats, _onRectangleClick);
};

const onRectangleClick = (
  infoWindow,
  rectangles,
  sessionIds,
  buildQueryParamsForCrowdMapLayer
) => rectangleData => {
  infoWindow.show(
    "/api/region",
    { q: buildQueryParamsForCrowdMapLayer.call(sessionIds, rectangleData) },
    rectangles.position(rectangleData)
  );
};
