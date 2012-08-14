var mockRequestsSensors = function($httpBackend){
  $httpBackend.when('GET', '/api/sensors').respond(MockData.sensors, {});
};

var setAircasting = function(){
  return module('aircasting');
};

var provideGoogleCore = function(){
  return module(function($provide) {
    $provide.value('googleCore', MockData.googleCore());
  });
};

