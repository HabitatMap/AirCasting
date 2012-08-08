angular.module("aircasting").factory('geocoder', function() {
  var geocoder = new google.maps.Geocoder();
  return {
    get: function(address, callback){
      geocoder.geocode({address: address}, callback);
    }
  };
});

