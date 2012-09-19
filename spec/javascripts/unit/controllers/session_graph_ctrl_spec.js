describe('SessionsGraphCtrl', function() {
  var scope, ctrl;

  beforeEach(setAircasting());
  beforeEach(provideGoogleCore());

  beforeEach(inject(function($rootScope, $controller, $httpBackend) {
    scope = $rootScope.$new();
    mockRequestsSensors($httpBackend);
    ctrl = $controller(SessionsGraphCtrl, {$scope: scope});
  }));

  xit('should toggle section', function() {

    expect(scope.expanded).toBeFalsy();
    scope.toggle();
    expect(scope.expanded).toBeTruthy();
  });

});

