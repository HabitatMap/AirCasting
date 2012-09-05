angular.module("aircasting").factory('versioner', [
                                     function() {
  var Versioner = function() {
    this.version = $('body').data('version');
  };
  Versioner.prototype = {
    path: function(path) {
      return path + "?v=" + this.version;
    }
  };
  return new Versioner();
}]);

