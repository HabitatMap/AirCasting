angular.module("google").factory("note",  ["$http", "$compile", "$rootScope",
                                 function($http, $compile, $rootScope){
  var Note = function() {
    this.popup = new google.maps.InfoWindow();
  };
  Note.prototype = {
    get: function() {
      return this.popup;
    },
    show: function(note, idx, relatedMarker, map){
      this.popup.open(map, relatedMarker);
      this.data = note;
      this.idx = idx;
      var element = $("<div class=\"note-window\" ng-include src=\"'/partials/note.html'\"></div>");
      $compile(element[0])($rootScope);
      this.popup.setContent(element[0]);
    },
    hide: function() {
      this.popup.close();
    }
  };

  return new Note();
}]);
