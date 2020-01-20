import _ from "underscore";
import constants from "../../../javascript/constants";
import { clearMap } from "../../../javascript/clearMap";
import * as build from "../../../javascript/buildQueryParamsForCrowdMapLayer";
const buildQueryParamsForCrowdMapLayer_ =
  build.buildQueryParamsForCrowdMapLayer;
import rectangles_ from "../../../javascript/rectangles";
import infoWindow_ from "../../../javascript/infoWindow";
import heat from "../../../javascript/heat";

const updateCrowdMapLayer_ = (
  buildQueryParamsForCrowdMapLayer,
  infoWindow,
  rectangles
) => (map, $http, params, $window) => ({
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
      .success(onAveragesFetch($window, map, params, _onRectangleClick));
  }
});

const onAveragesFetch = ($window, map, params, _onRectangleClick) => data => {
  if ($window.location.pathname !== constants.mobileMapRoute) return;
  const heats = heat.heats(params.get("data").heat);
  map.drawRectangles(data, heats, _onRectangleClick);
};

const onRectangleClick = (
  infoWindow,
  rectangles,
  sessionIds,
  buildQueryParamsForCrowdMapLayer
) => rectangleData => {
  infoWindow.show(
    "/api/region.json",
    { q: buildQueryParamsForCrowdMapLayer.call(sessionIds, rectangleData) },
    rectangles.position(rectangleData),
    constants.mobileSession
  );
};

export const updateCrowdMapLayer = updateCrowdMapLayer_(
  buildQueryParamsForCrowdMapLayer_,
  infoWindow_,
  rectangles_
);
export const updateCrowdMapLayerTest = (
  buildQueryParamsForCrowdMapLayer,
  infoWindow,
  rectangles
) =>
  updateCrowdMapLayer_(
    buildQueryParamsForCrowdMapLayer,
    infoWindow,
    rectangles
  );
