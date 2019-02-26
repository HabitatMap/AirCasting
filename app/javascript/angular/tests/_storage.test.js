import test from 'blue-tape';
import { mock } from './helpers';
import { storage } from '../code/services/_storage';
import sinon from 'sinon';

test('resetAddress calls params.update with emptied address', t => {
  const params = mock('update');
  const service = _storage({ params });
  service.set('location', { address: 'new york', streaming: true });

  service.resetAddress();

  t.true(params.wasCalledWith({ data: { location: { address: '', streaming: true } } }));

  t.end();
});

test('isCrowdMapLayerOn', t => {
  const service = _storage({});
  service.set('crowdMap', true);

  const actual = service.isCrowdMapLayerOn();

  t.true(actual);

  t.end();
});

test('updateCrowdMapDataInParams updates params preserving old values', t => {
  const params = mock('update');
  const service = _storage({ params });
  service.set('crowdMap', true);
  service.set('gridResolution', 1);
  service.set('heat', {});

  const actual = service.updateCrowdMapDataInParams();

  const expected = { data: { gridResolution: 1, crowdMap: true, heat: {} } };
  t.true(params.wasCalledWith(expected));

  t.end();
});

test('toggleCrowdMapData toggles crowdMap value in params and crowdMap value in storage', t => {
  const update = sinon.spy();
  const params = { update };
  const service = _storage({ params });
  service.set('crowdMap', false);

  service.toggleCrowdMapData();

  const expected = { data: { gridResolution: undefined, crowdMap: true, heat: {}}};
  t.true(update.calledWith(expected));
  t.true(service.get('crowdMap'));

  t.end();
});

const _storage = ({ params }) => {
  const $rootScope = { $new: () => ({ $watch: () => {} }) };
  const utils = {
    merge: (obj1, obj2) => ({ ...obj1, ...obj2 })
  };
  return storage(params, $rootScope, utils);
};
