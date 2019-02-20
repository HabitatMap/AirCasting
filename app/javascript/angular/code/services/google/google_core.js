angular.module("google").factory('googleCore', function() {
  return {
    geocoder: function(){
      return new google.maps.Geocoder();
    }
  };
});

