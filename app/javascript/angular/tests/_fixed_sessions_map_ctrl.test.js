import test from "blue-tape";
import { mock } from "./helpers";
import { SessionsMapCtrl } from "../code/controllers/_sessions_map_ctrl";
import moment from "moment";
import { DEFAULT_THEME } from "../../javascript/constants";

test("it updates defaults", t => {
  let defaults = {};
  const sensorId = "sensor id";
  const params = {
    get: () => ({ sensorId }),
    updateFromDefaults: opts => (defaults = opts)
  };

  _SessionsMapCtrl({ params });

  const expected = {
    sensorId,
    location: "",
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
    isIndoor: false,
    isActive: true
  };
  t.deepEqual(defaults, expected);

  t.end();
});

const _SessionsMapCtrl = ({ params }) => {
  const _sensors = {
    setSensors: () => {}
  };
  const _params = { get: () => ({}), updateFromDefaults: () => {}, ...params };
  const _$scope = { $on: () => {} };
  const _map = {
    unregisterAll: () => {}
  };
  const $window = {};
  const sessions = { isMobile: () => false };

  return SessionsMapCtrl(_$scope, _params, _map, _sensors, sessions, $window);
};
