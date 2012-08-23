angular.module("google").factory("infoWindow",  ["map", "$http",
                                 function(map, $http){
  var InfoWindow = function() {
    this.popup = new google.maps.InfoWindow();
  };
  InfoWindow.prototype = {
    get: function() {
      return this.popup;
    },
    show: function(url, data, position){
      this.popup.setContent("working..");
      $http.get(url, {params : data}).success(_(this.onShowData).bind(this));
      this.popup.setPosition(position);
      this.popup.open(map.get());
    },
    onShowData: function(data, status, headers, config){
      this.data = data;
      this.popup.setContent($("#infoWindow").html());
    },
    hide: function() {
      this.popup.close();
    }
  };

  return new InfoWindow();
}]);
