angular.module("aircasting").factory('flash', function() {
  var Flash = function() {
  };

  Flash.prototype = {
    set: function(message) {
      this.message = message;
    },
    clear: function(heat) {
      delete this.message;
    }
  };

  return new Flash();
});

