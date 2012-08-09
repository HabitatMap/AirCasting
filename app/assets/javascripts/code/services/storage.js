angular.module("aircasting").factory('storage', ['params', '$rootScope',  function(params, $rootScope) {
  var Storage = function() {
    this.data = {};
    self = this;
    var scope = $rootScope.$new();
    //TODO change to emitter and broadcasters
    scope.params = params;
    scope.$watch("params.getData()", function(newValue, oldValue) {
      self.extend(newValue);
    }, true);
  };
  Storage.prototype = {
    get : function(name) {
      return this.data[name];
    },
    set : function(name, value) {
      this.data[name] = angular.copy(value);
    },
    setInHash: function(hashName, name, value) {
      this.data[hashName][name] = angular.copy(value);
    },
    extend: function(data) {
      _.extend(this.data, angular.copy(data));
    },
    update: function(name) {
      var obj = {};
      obj[name] = this.get(name);
      params.update(obj);
    },
    reset: function(name) {
      this.set(name, angular.copy(params.getData()[name]));
    }
  };
  return new Storage();
}]);

