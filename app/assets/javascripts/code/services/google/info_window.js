angular.module("google").factory("infoWindow",  ["map", "$http", "$compile", "$rootScope",
                                 function(map, $http, $compile, $rootScope){
  var InfoWindow = function() {
    this.popup = new google.maps.InfoWindow();
  };
  InfoWindow.prototype = {
    get: function() {
      return this.popup;
    },
    show: function(url, data, position){
      this.popup.setContent("working..");
      $http.get(url, {params : data, cache: true}).success(_(this.onShowData).bind(this));
      this.popup.setPosition(position);
      this.popup.open(map.get());
    },
    onShowData: function(data, status, headers, config){
      this.data = data;
      var element = $("<div class=\"infoWindow\" ng-include src=\"'/partials/info_window.html'\"></div>");
      $compile(element[0])($rootScope);
      this.popup.setContent(element[0]);
    },
    hide: function() {
      this.popup.close();
    }
  };

  return new InfoWindow();
}]);
