import test from "blue-tape";
import { mock } from "./helpers";
import { MobileSessionsMapCtrl } from "../code/controllers/_mobile_sessions_map_ctrl";
import moment from "moment";

test("it updates defaults", t => {
  let defaults = {};
  const sensorId = "sensor id";
  const params = {
    get: () => ({ sensorId }),
    updateFromDefaults: opts => (defaults = opts)
  };

  _MobileSessionsMapCtrl({ params });

  const expected = {
    sensorId,
    location: "",
    tags: "",
    usernames: "",
    gridResolution: 31,
    crowdMap: false,
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
    }
  };
  t.deepEqual(defaults, expected);

  t.end();
});

const _MobileSessionsMapCtrl = ({ $scope, map, callback, sensors, params }) => {
  const _sensors = {
    setSensors: () => {},
    fetchHeatLevels: () => {},
    ...sensors
  };
  const _params = { get: () => ({}), updateFromDefaults: () => {}, ...params };
  const infoWindow = { hide: () => {} };
  const _map = {
    goToAddress: () => {},
    unregisterAll: () => {},
    removeAllMarkers: () => {},
    clearRectangles: () => {},
    ...map
  };
  const _$scope = { $watch: () => {}, ...$scope };
  const _$window = {};

  return MobileSessionsMapCtrl(
    _$scope,
    _params,
    _map,
    _sensors,
    null,
    null,
    _$window,
    infoWindow
  );
};
