import _ from "underscore";
import constants from "./constants";
import { clearMap } from "./clearMap";
import * as build from "./buildQueryParamsForCrowdMapLayer";
const buildQueryParamsForCrowdMapLayer_ =
  build.buildQueryParamsForCrowdMapLayer;
import rectangles_ from "./rectangles";
import infoWindow_ from "./infoWindow";
import heat from "./heat";
import params_ from "./params2";
import map_ from "./map";
import * as http from "./http";

const updateCrowdMapLayer_ = (
  buildQueryParamsForCrowdMapLayer,
  http,
  infoWindow,
  map,
  params,
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

    http
      .getQ("/api/averages2.json", q)
      .then(onAveragesFetch($window, map, params, _onRectangleClick));
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

export default updateCrowdMapLayer_(
  buildQueryParamsForCrowdMapLayer_,
  http,
  infoWindow_,
  map_,
  params_,
  rectangles_,
  process.env.NODE_ENV === "test" ? {} : window
);

export const updateCrowdMapLayerTest = (
  buildQueryParamsForCrowdMapLayer,
  http,
  infoWindow,
  map,
  params,
  rectangles,
  window
) =>
  updateCrowdMapLayer_(
    buildQueryParamsForCrowdMapLayer,
    http,
    infoWindow,
    map,
    params,
    rectangles,
    window
  );
