angular.module("aircasting").factory("googleMapManager", ["$cookies", function($cookies){
  var self = this;
  return {
    init: function(element, options) {
      self.googleMap = new google.maps.Map(element, options);
    },
    viewport: function(){
      console.log(self.googleMap)
      var bounds = self.googleMap.getBounds();
      if(bounds) {
        return {
          west: bounds.getSouthWest().lng(),
          east: bounds.getNorthEast().lng(),
          south: bounds.getSouthWest().lat(),
          north: bounds.getNorthEast().lat()
        };
      } else {
        return {};
      }
    }
  };
}]);
