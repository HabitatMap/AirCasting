import test from "blue-tape";
import { mock } from "./helpers";
import { SessionsMapCtrl } from "../code/controllers/_sessions_map_ctrl";

test("with no sessions selected and isSearchAsIMoveOn true when params.map changes it calls sessions.fetch", t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) =>
      str.includes("map") ? callbacks.push(callback) : null
  };
  const sessions = {
    ...mock("fetch")
  };
  const params = {
    get: () => ({ isSearchAsIMoveOn: true })
  };
  _SessionsMapCtrl({ $scope, sessions, params });

  callbacks.forEach(callback =>
    callback({ hasChangedProgrammatically: false })
  );

  t.true(sessions.wasCalled());

  t.end();
});

test("with session selected when params.map changes it does not call sessions.fetch", t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) =>
      str.includes("map") ? callbacks.push(callback) : null
  };
  const sessions = {
    ...mock("fetch")
  };
  _SessionsMapCtrl({ $scope, sessions });

  callbacks.forEach(callback => callback({}));

  t.false(sessions.wasCalled());

  t.end();
});

const _SessionsMapCtrl = ({ $scope, sessions, params }) => {
  const _sensors = {
    setSensors: () => {}
  };
  const $window = {};
  const _sessions = {
    isMobile: () => false,
    ...sessions
  };
  const _$scope = {
    setDefaults: () => {},
    $watch: () => {},
    $on: () => {},
    ...$scope
  };
  const _params = {
    get: () => ({}),
    updateFromDefaults: () => {},
    ...params
  };
  const _map = {
    unregisterAll: () => {}
  };
  const _sessionsUtils = { isSessionSelected: () => false };

  return SessionsMapCtrl(
    _$scope,
    _params,
    _map,
    _sensors,
    _sessions,
    null,
    $window,
    _sessionsUtils
  );
};
