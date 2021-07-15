import _ from "underscore";
import constants from "./constants";
import { clearMap } from "./clearMap";
import { buildQueryParamsForCrowdMapLayer } from "./buildQueryParamsForCrowdMapLayer";
import rectangles from "./rectangles";
import infoWindow from "./infoWindow";
import heat from "./heat";
import params from "./params2";
import map from "./map";
import * as http from "./http";

export default {
  call: (sessionIds) => {
    if (!params.isCrowdMapOn()) return;
    clearMap();

    const bounds = map.getBounds();
    const q = buildQueryParamsForCrowdMapLayer.call(sessionIds, bounds);
    if (!q) return;

    const _onRectangleClick = onRectangleClick(sessionIds);

    http
      .getQ("/api/averages2.json", q)
      .then(onAveragesFetch(_onRectangleClick));
  },
};

const onAveragesFetch = (_onRectangleClick) => (data) => {
  if (window.location.pathname !== constants.mobileMapRoute) return;
  const heats = heat.heats(params.get("data").heat);
  map.drawRectangles(data, heats, _onRectangleClick);
};

const onRectangleClick = (sessionIds) => (rectangleData) => {
  infoWindow.show(
    "/api/region.json",
    { q: buildQueryParamsForCrowdMapLayer.call(sessionIds, rectangleData) },
    rectangles.position(rectangleData),
    constants.mobileSession
  );
};
