angular.module('aircasting').factory('promiseStorage', function() {
  var PromiseStorage = function() {
    this.promises = [];
  };

  PromiseStorage.prototype = {
    get: function() {
      return this.promises;
    },

    push: function(promise) {
      this.promises.push(promise);
    },

    clear: function() {
      this.promises = [];
    }
  };

  return new PromiseStorage();
});
