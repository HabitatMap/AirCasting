angular.module("google").factory('geocoder', ["googleCore", function(googleCore) {
  var geocoder = googleCore.geocoder();
  return {
    get: function(address, callback){
      geocoder.geocode({address: address}, callback);
    }
  };
}]);

