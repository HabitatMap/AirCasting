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

const _storage = ({ params }) => {
  const $rootScope = { $new: () => ({ $watch: () => {} }) };
  const utils = {
    merge: (obj1, obj2) => ({ ...obj1, ...obj2 })
  };
  return storage(params, $rootScope, utils);
};
