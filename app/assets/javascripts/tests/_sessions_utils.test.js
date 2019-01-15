import test from 'blue-tape';
import { mock } from './helpers';
import { sessionsUtils } from '../code/services/_sessions_utils';

test('onSingleSessionFetch overwrites session.streams with data.streams and add loaded flag to session', t => {
  const data = { streams: [1] };
  const session = { streams: [2] };
  const service = _sessionsUtils({});

  service.onSingleSessionFetch(session, data, () => {});

  t.deepEqual(data, {});
  t.deepEqual(session, { loaded: true, streams: [1] });

  t.end();
});

test('onSingleSessionFetch calls the passed callback', t => {
  let called = false;
  const callback = () => { called = true; }

  const service = _sessionsUtils({});

  service.onSingleSessionFetch({}, {}, callback);

  t.true(called);

  t.end();
});

test('onSingleSessionFetch calls updateCrowdMapLayer with the session id', t => {
  const sessionId = 1;
  const session = { id: sessionId };
  const updateCrowdMapLayer = mock('call');
  const service = _sessionsUtils({ updateCrowdMapLayer });

  service.onSingleSessionFetch(session, {}, () => {});

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
