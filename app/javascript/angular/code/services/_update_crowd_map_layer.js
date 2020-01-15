import _ from "underscore";
import constants from "../../../javascript/constants";
import { clearMap } from "../../../javascript/clearMap";
import * as build from "../../../javascript/buildQueryParamsForCrowdMapLayer";
const buildQueryParamsForCrowdMapLayer_ =
  build.buildQueryParamsForCrowdMapLayer;

const updateCrowdMapLayer_ = buildQueryParamsForCrowdMapLayer => (
  map,
  $http,
  params,
  utils,
  infoWindow,
  rectangles,
  $window
) => ({
  call: sessionIds => {
    if (!params.isCrowdMapOn()) return;
    clearMap();

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
      .get("/api/averages2", { cache: true, params: { q } })
      .success(onAveragesFetch($window, map, params, utils, _onRectangleClick));
  }
});

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

export const updateCrowdMapLayer = updateCrowdMapLayer_(
  buildQueryParamsForCrowdMapLayer_
);
export const updateCrowdMapLayerTest = buildQueryParamsForCrowdMapLayer =>
  updateCrowdMapLayer_(buildQueryParamsForCrowdMapLayer);
