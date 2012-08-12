describe('sessions', function() {
  var sessions, params, sensors;

  beforeEach(module('aircasting'));
  beforeEach(
    inject(function($injector) {
      sessions = $injector.get('sessions');
    })
  );

});


