angular.module("google").factory("note",  ["$http", "$compile", "$rootScope","$timeout", 'versioner', 'map',
                                 function($http, $compile, $rootScope, $timeout, versioner, map){
  var Note = function() {
    this.popup = new google.maps.InfoWindow();
    map.listen("zoom_changed", _(this.hide).bind(this));
  };
  Note.prototype = {
    get: function() {
      return this.popup;
    },
    show: function(note, idx, relatedMarker){
      this.popup.open(map.get(), relatedMarker);
      this.data = note;
      this.idx = idx;
      var self = this;
      var url = versioner.path('/partials/note.html');
      var element = $("<div class=\"note-window\"><div ng-include=\"'" + url + "'\"></div></div>");
      $timeout(function(){
        $compile(element[0])($rootScope);
        self.popup.setContent(element[0]);
      });
    },
    hide: function() {
      this.popup.close();
    },
    drawNote: function(item, idx){
      var self = this;
      var marker = map.drawMarker(item, {
        title: item.text,
        icon: "/assets/marker_note.png",
        zIndex: 200000
      });

      google.maps.event.addListener(marker, 'click', function(){
        self.show(item, idx, marker);
      });
      return marker;
    }
  };

  return new Note();
}]);
