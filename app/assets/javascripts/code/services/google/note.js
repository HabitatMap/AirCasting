angular.module("google").factory("note",  ["$http", "$compile", "$rootScope","$timeout", 'versioner',
                                 function($http, $compile, $rootScope, $timeout, versioner){
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
      var self = this;
      $timeout(function(){
        var url = versioner.path('/partials/note.html');
        var element = $("<div class=\"note-window\"><div ng-include=\"'" + url + "'\"></div></div>");
        $compile(element[0])($rootScope);
        self.popup.setContent(element[0]);
      });
    },
    hide: function() {
      this.popup.close();
    }
  };

  return new Note();
}]);

