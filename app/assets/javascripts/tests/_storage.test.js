import test from 'blue-tape';
import { mock } from './helpers';
import { storage } from '../code/services/_storage';

test('resetAddress calls params.update with emptied address', t => {
  const params = mock('update');
  const storageService = _storage(params);
  storageService.set('location', { address: 'new york', streaming: true });

  storageService.resetAddress();

  t.true(params.wasCalledWith({ data: { location: { address: '', streaming: true } } }));

  t.end();
});

test('isCrowdMapLayerOn', t => {
  const storageService = _storage();
  storageService.set('crowdMap', true);

  const actual = storageService.isCrowdMapLayerOn();

  t.true(actual);

  t.end();
});

const _storage = (params) => {
  const $rootScope = { $new: () => ({ $watch: () => {} }) };
  return storage(params, $rootScope);
};
