import test from 'blue-tape';
import { mock } from './helpers';
import { storage } from '../code/services/_storage';

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

test('updateCrowdMapLayer updates params preserving old values', t => {
  const params = mock('update');
  const service = _storage({ params });
  service.set('crowdMap', true);
  service.set('gridResolution', 1);
  service.set('heat', {});

  const actual = service.updateCrowdMapLayer();

  const expected = { data: { gridResolution: 1, crowdMap: true, heat: {} } };
  t.true(params.wasCalledWith(expected));

  t.end();
});

test('resetCrowdMapLayer resets to defaults and calls updateCrowdMapLayer', t => {
  const params = mock('update');
  const service = _storage({ params });
  service.updateDefaults({
   gridResolution: 2,
   crowdMap: false,
  });
  service.set('crowdMap', true);
  service.set('gridResolution', 1);

  const actual = service.resetCrowdMapLayer();

  const expected = { data: { gridResolution: 2, crowdMap: false, heat: {} } };
  t.true(params.wasCalledWith(expected));

  t.end();
});

const _storage = ({ params }) => {
  const $rootScope = { $new: () => ({ $watch: () => {} }) };
  const utils = {
    merge: (obj1, obj2) => ({ ...obj1, ...obj2 })
  };
  return storage(params, $rootScope, utils);
};
