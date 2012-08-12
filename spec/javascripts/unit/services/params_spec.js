describe('params', function() {
  var $location, params;

  beforeEach(module('aircasting'));

  beforeEach(
    inject(function($injector) {
      params = $injector.get('params');
      $location = $injector.get('params');
    })
  );

  describe('get', function() {
    it('should return empty search params when no specified data in url', function() {
      expect(params.get("name")).toEqual({});
    });
    it('should return default value when no data in url', function() {
      expect(params.get("specified", [])).toEqual([]);
    });
    it('should return paramData when it is set', function() {
      params.paramsData = {data : { test: "1"}};
      expect(params.get("data", [])).toEqual(params.paramsData.data);
    });
  });

  describe('update', function() {
    it('should update params and set proper location search', function() {
    });
    it('should clear params and location search', function() {
    });
  });

  describe('location url', function() {
    it('should change paramsData when location url changes', function() {
    });
  });

});


