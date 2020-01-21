import test from "blue-tape";
import { mock } from "./helpers";
import { SessionsMapCtrlTest } from "../../javascript/sessionsMap";
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
    gridResolution: 31,
    crowdMap: false
  };
  t.deepEqual(defaults, expected);

  t.end();
});

const _SessionsMapCtrl = ({ params }) => {
  const _sensors = {
    setSensors: () => {}
  };
  const _params = { get: () => ({}), updateFromDefaults: () => {}, ...params };
  const _map = {
    unregisterAll: () => {}
  };
  const _$scope = { $on: () => {} };
  const _$window = {};
  const sessions = { isMobile: () => true };
  const _pubsub = {
    subscribe: () => {}
  };

  return SessionsMapCtrlTest(
    _map,
    _params,
    _pubsub,
    _sensors,
    sessions,
    null,
    _$window
  );
};
