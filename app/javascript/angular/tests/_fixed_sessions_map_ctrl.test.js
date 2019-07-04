import test from "blue-tape";
import { mock } from "./helpers";
import { FixedSessionsMapCtrl } from "../code/controllers/_fixed_sessions_map_ctrl";
import moment from "moment";

test("it updates defaults", t => {
  let defaults = {};
  const sensorId = "sensor id";
  const params = {
    get: () => ({ sensorId }),
    updateFromDefaults: opts => (defaults = opts)
  };

  _FixedSessionsMapCtrl({ params });

  const expected = {
    sensorId,
    location: "",
    isIndoor: false,
    isStreaming: true,
    tags: "",
    usernames: "",
    timeFrom: moment()
      .utc()
      .startOf("day")
      .subtract(1, "year")
      .format("X"),
    timeTo: moment()
      .utc()
      .endOf("day")
      .format("X"),
    heat: {
      lowest: 0,
      low: 12,
      mid: 35,
      high: 55,
      highest: 150
    },
    theme: "default"
  };
  t.deepEqual(defaults, expected);

  t.end();
});

const _FixedSessionsMapCtrl = ({ callback, params, sensors }) => {
  const _sensors = {
    setSensors: () => {},
    fetchHeatLevels: () => {},
    ...sensors
  };
  const _params = { get: () => ({}), updateFromDefaults: () => {}, ...params };
  const rectangles = { clear: () => {} };
  const infoWindow = { hide: () => {} };
  const _$scope = { $watch: () => {} };
  const _map = {
    unregisterAll: () => {},
    clearRectangles: () => {},
    removeAllMarkers: () => {}
  };
  const $window = {};

  return FixedSessionsMapCtrl(
    _$scope,
    _params,
    null,
    _map,
    _sensors,
    null,
    null,
    $window,
    infoWindow
  );
};
