describe('utils', function() {
  var utils;

  beforeEach(module('aircasting'));
  beforeEach(
    inject(function($injector) {
      utils = $injector.get('utils');
    })
  );

  describe('merge', function() {
    it('should do proper merge of two objects case1', function() {
      var obj1 = {data: { heat: { low: 1, mid: 3, high: 2}}, ids: [1, 2]};
      var obj2 = {data: { heat: { low: 3, mid:  undefined}}, collection: { first: [1]}};
      expect(utils.merge(obj1, obj2)).toEqual({data: { heat: { low: 3, mid: undefined, high: 2}},
                                              ids: [1, 2], collection: { first: [1]}});
    });
    it('should do proper merge of two objects case2', function() {
      var obj1 = {data: { heat: { low: 1, mid: 3, high: 2}}, ids: [1, 2]};
      var obj2 = {ids: []};
      expect(utils.merge(obj1, obj2)).toEqual({data: { heat: { low: 1, mid: 3, high: 2}},
                                              ids: []});
    });
  });
});


