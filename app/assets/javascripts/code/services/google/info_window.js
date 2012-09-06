angular.module("google").factory("infoWindow", ["map", "$http", "$compile", "$rootScope", 'versioner',
                                 function(map, $http, $compile, $rootScope, versioner){
  var InfoWindow = function() {
    this.popup = new google.maps.InfoWindow();
    map.listen("zoom_changed", _(this.hide).bind(this));
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
      var url = versioner.path('/partials/info_window.html');
      var element = $("<div class=\"infoWindow\" ng-include=\"'" + url  +"'\"></div>");
      $compile(element[0])($rootScope);
      this.popup.setContent(element[0]);
    },
    hide: function() {
      this.popup.close();
    }
  };

  return new InfoWindow();
}]);
