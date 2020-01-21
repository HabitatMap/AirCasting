import test from "blue-tape";
import { mock } from "./helpers";
import { SessionsMapCtrlTest } from "../code/controllers/_sessions_map_ctrl";

test("with no sessions selected and isSearchAsIMoveOn true when params.map changes it calls sessions.fetch", t => {
  const callbacks = [];
  const pubsub = {
    subscribe: (str, callback) =>
      str === "googleMapsChanged" ? callbacks.push(callback) : null
  };
  const sessions = {
    ...mock("fetch")
  };
  const params = {
    get: () => ({ isSearchAsIMoveOn: true })
  };
  _SessionsMapCtrl({ pubsub, sessions, params });

  callbacks.forEach(callback =>
    callback({ hasChangedProgrammatically: false })
  );

  t.true(sessions.wasCalled());

  t.end();
});

test("with session selected when params.map changes it does not call sessions.fetch", t => {
  const callbacks = [];
  const pubsub = {
    pubsub: (str, callback) =>
      str === "googleMapsChanged" ? callbacks.push(callback) : null
  };
  const sessions = {
    ...mock("fetch")
  };
  _SessionsMapCtrl({ pubsub, sessions });

  callbacks.forEach(callback => callback({}));

  t.false(sessions.wasCalled());

  t.end();
});

const _SessionsMapCtrl = ({ sessions, params, pubsub }) => {
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
    $on: () => {}
  };
  const _params = {
    get: () => ({}),
    updateFromDefaults: () => {},
    isSessionSelected: () => false,
    ...params
  };
  const _map = {
    unregisterAll: () => {}
  };
  const _pubsub = {
    subscribe: () => {},
    ...pubsub
  };

  return SessionsMapCtrlTest(_map, _params, _pubsub, _sensors)(
    _$scope,
    _sessions,
    $window
  );
};
