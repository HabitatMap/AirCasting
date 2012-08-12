describe('storage', function() {
  var storage, storageEvents, params;

  beforeEach(module('aircasting'));
  beforeEach(
    inject(function($injector) {
      storage = $injector.get('storage');
      storageEvents = $injector.get('storageEvents');
      params = $injector.get('params');
    })
  );

});


