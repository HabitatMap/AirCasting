describe('sessionsExporter', function() {
  var sessionsExporter, $window;

  beforeEach(module('aircasting'));
  beforeEach(
    inject(function($injector) {
      sessionsExporter = $injector.get('sessionsExporter');
      $window = $injector.get('$window');
      $window.open = jasmine.createSpy('open');
    })
  );

  it('opens new window', function() {
    sessionsExporter([1,2,3]);
    expect($window.open).toHaveBeenCalledWith('/api/sessions/export.json?session_ids[]=1&session_ids[]=2&session_ids[]=3', '_blank', '');
  });
});
