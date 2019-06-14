import _ from "underscore";
import constants from "../../../javascript/constants";
import { clearMap } from "../../../javascript/mapsUtils";

export const updateCrowdMapLayer = (
  map,
  $http,
  buildQueryParamsForCrowdMapLayer,
  params,
  utils,
  infoWindow,
  rectangles,
  $window
) => ({
  call: sessionIds => {
    clearMap();
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
