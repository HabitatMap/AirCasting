import test from "blue-tape";
import { mock } from "./helpers";
import { SessionsListCtrl } from "../code/controllers/_sessions_list_ctrl";

test("with no sessions selected when params.map changes it calls sessions.fetch", t => {
  const callbacks = [];
  const $scope = {
    $watch: (str, callback) =>
      str.includes("map") ? callbacks.push(callback) : null
  };
  const sessions = {
    ...mock("fetch")
  };
  _SessionsListCtrl({ $scope, sessions });

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
  _SessionsListCtrl({ $scope, sessions });

  callbacks.forEach(callback => callback({}));

  t.false(sessions.wasCalled());

  t.end();
});

const _SessionsListCtrl = ({ map, $scope, updateCrowdMapLayer, sessions }) => {
  const _sessions = { reSelectAllSessions: () => {}, ...sessions };
  const _$scope = {
    sessions: _sessions,
    setDefaults: () => {},
    $watch: () => {},
    $on: () => {},
    ...$scope
  };
  const params = { get: () => ({}), update: () => {}, paramsData: {} };
  const _map = {
    onPanOrZoom: () => {},
    ...map
  };
  const _updateCrowdMapLayer = updateCrowdMapLayer || {};
  const $location = {
    path: () => "/map_sessions"
  };
  const _sessionsUtils = { isSessionSelected: () => false };

  return SessionsListCtrl(
    _$scope,
    params,
    null,
    null,
    {},
    null,
    null,
    _sessionsUtils,
    _map
  );
};
