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

    show: function(url, data, position, type){
      this.popup.setContent("working..");
      this.popup.setPosition(position);
      this.popup.open(map.get());
      const htmlFile = (type === "Fixed") ? '/partials/fixed_info_window.html' : '/partials/info_window.html';

      $timeout(() => {
        $http.get(url, {params : data, cache: true}).success((data, status, headers, config) => this.onShowData(data, status, headers, config, htmlFile));
      }, 1);
    },

    onShowData: function(data, status, headers, config, htmlFile){
      this.data = data;
      var url = versioner.path(htmlFile);
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
