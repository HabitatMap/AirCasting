describe('params', function() {
  var $location, params, $rootScope;

  beforeEach(module('aircasting'));

  beforeEach(
    inject(function($injector) {
      params = $injector.get('params');
      $location = $injector.get('$location');
      $rootScope = $injector.get('$rootScope');
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
      params.paramsData = {data: { myData: "1"}, myData: "1"};
      params.update({data: { somethingNew: []}});
      expect(params.get("data")).toEqual({ myData: "1", somethingNew: []});
      expect(params.get("myData")).toEqual("1");
      expect($location.search()).toEqual({ data : '{"myData":"1","somethingNew":[]}', myData : '"1"' });
    });
  });

  describe('location url', function() {
    it('should change paramsData when location url changes', function() {
      $location.search({ data : '{"myData":"1","somethingNew":[]}', myData : '"1"' });
      $rootScope.$digest();
      expect(params.paramsData).toEqual({data: { myData: "1", somethingNew: []}, myData: "1"});
    });
  });

});


