angular.module("google").factory("infoWindow",  function(){
  var InfoWindow = function() {
    this.popup = new google.maps.InfoWindow();
  };
  InfoWindow.prototype = {
    get: function() {
      return this.popup;
    },
    show: function(lat, lng){
      var position = new google.maps.LatLng(lat, lng);
      this.popup.setContent('<div ng-controller="MapPopup">Loading...</div>');
      this.popup.infoWindow.setPosition(position);
    },
    hide: function() {
      this.popup.close();
    }
  };

  return new InfoWindow();
});

