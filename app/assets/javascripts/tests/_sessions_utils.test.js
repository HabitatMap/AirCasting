import test from 'blue-tape';
import { mock } from './helpers';
import { sessionsUtils } from '../code/services/_sessions_utils';

test('onSingleSessionFetch extends session.streams with data.streams with lower case keys', t => {
  const data = { streams: { Key1: 1 } };
  const session = { streams: { key2: 2 } };
  const service = _sessionsUtils({});

  service.onSingleSessionFetch(session, data, () => {});

  t.deepEqual(data, {});
  t.deepEqual(session, { loaded: true, streams: { key2: 2, key1: 1 } });

  t.end();
});

test('onSingleSessionFetch adds loaded flag to session', t => {
  const session = {};
  const service = _sessionsUtils({});

  service.onSingleSessionFetch(session, { streams: {} }, () => {});

  t.deepEqual(session, { loaded: true });

  t.end();
});

test('onSingleSessionFetch calls the passed callback', t => {
  let called = false;
  const callback = () => { called = true; }

  const service = _sessionsUtils({});

  service.onSingleSessionFetch({}, { streams: {} }, callback);

  t.true(called);

  t.end();
});

test('onSingleSessionFetch calls updateCrowdMapLayer with the session id', t => {
  const sessionId = 1;
  const session = { id: sessionId };
  const updateCrowdMapLayer = mock('call');
  const service = _sessionsUtils({ updateCrowdMapLayer });

  service.onSingleSessionFetch(session, { streams: {} }, () => {});

  t.true(updateCrowdMapLayer.wasCalledWith([sessionId]));

  t.end();
});

const _sessionsUtils = ({ updateCrowdMapLayer }) => {
  const _updateCrowdMapLayer = {
    call: () => {},
    ...updateCrowdMapLayer
  };

  return sessionsUtils(null, null, null, null, null, _updateCrowdMapLayer);
};
