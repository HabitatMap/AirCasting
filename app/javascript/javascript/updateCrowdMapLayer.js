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
  call: (streamIds) => {
    if (!params.isCrowdMapOn()) return;
    clearMap();

    const bounds = map.getBounds();
    const q = buildQueryParamsForCrowdMapLayer.call(streamIds, bounds);
    if (!q) return;

    const _onRectangleClick = onRectangleClick(streamIds);

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

const onRectangleClick = (streamIds) => (rectangleData) => {
  infoWindow.show({
    url: "/api/region.json",
    params: buildQueryParamsForCrowdMapLayer.call(streamIds, rectangleData),
    position: rectangles.position(rectangleData),
    sessionType: constants.mobileSession,
  });
};
