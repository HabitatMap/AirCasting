angular.module("google").factory("infoWindow",  ["map", "$http",
                                 function(map, $http){
  var InfoWindow = function() {
    this.hidden = 0;
    this.popup = new google.maps.InfoWindow();
    this.popup.setContent( $("#infoWindow")[0]);
  };
  InfoWindow.prototype = {
    get: function() {
      return this.popup;
    },
    show: function(url, data, position){
      this.hidden = this.hidden + 1;
      $http.get(url, {params : data}).success(_(this.onShowData).bind(this));
      this.popup.setPosition(position);
      this.popup.open(map.get());
    },
    onShowData: function(data, status, headers, config){
      this.data = data;
      this.hidden = this.hidden - 1;
    },
    visible: function(){
      return this.hidden == 0;
    },
    hide: function() {
      this.popup.close();
    }
  };

  return new InfoWindow();
}]);
