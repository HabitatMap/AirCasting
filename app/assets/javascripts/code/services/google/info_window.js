angular.module("google").factory("infoWindow",  ["map", "$http","spinner",
                                 function(map, $http, spinner){
  var InfoWindow = function() {
    this.hidden = true;
    this.popup = new google.maps.InfoWindow();
    this.popup.setContent( $("#infoWindow")[0]);
  };
  InfoWindow.prototype = {
    get: function() {
      return this.popup;
    },
    show: function(url, data, position){
      this.hidden = true;
      spinner.show();
      $http.get(url, {params : data}).success(_(this.onShowData).bind(this));
      this.popup.setPosition(position);
      this.popup.open(map.get());
    },
    onShowData: function(data, status, headers, config){
      spinner.hide();
      this.data = data;
      this.hidden = false;
    },
    hide: function() {
      this.popup.close();
      this.hidden = true;
    }
  };

  return new InfoWindow();
}]);
