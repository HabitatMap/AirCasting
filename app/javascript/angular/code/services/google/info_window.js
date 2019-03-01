angular.module("google").factory("infoWindow", ["map", "$http", "$compile", "$rootScope", 'versioner', '$timeout',
                                 function(map, $http, $compile, $rootScope, versioner, $timeout){
  var InfoWindow = function() {
    this.popup = new google.maps.InfoWindow();
    map.listen("zoom_changed", _(this.hide).bind(this));
  };
  InfoWindow.prototype = {
    get: function() {
      return this.popup;
    },
    show: function(url, data, position){
      var self = this;
      this.popup.setContent("working..");
      this.popup.setPosition(position);
      this.popup.open(map.get());
      $timeout(function(){
        $http.get(url, {params : data, cache: true}).success(_(self.onShowData).bind(self));
      }, 1);
    },
    onShowData: function(data, status, headers, config){
      this.data = data;
      var url = versioner.path('/partials/info_window.html');
      var element = $("<div class=\"infoWindow\"><div ng-include=\"'" + url  +"'\"></div></div>");
      $compile(element[0])($rootScope);
      this.popup.setContent(element[0]);
    },
    hide: function() {
      this.popup.close();
    }
  };

  return new InfoWindow();
}]);
