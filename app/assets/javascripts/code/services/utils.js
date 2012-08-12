angular.module("aircasting").factory('utils', function() {
  var Utils = function() {
  };
  Utils.prototype = {
    merge : function(source, obj2) {
      var self = this;
      var obj1 = angular.copy(source);
      _(obj2).each(function(value, key){
        var bothAreObjects = angular.isObject(obj1[key]) && angular.isObject(value);
        if(_(obj1).has(key) && bothAreObjects){
          self.merge(obj1[key], value);
        } else {
          obj1[key] = angular.copy(value);
        }
      })
      return obj1;
    },
  };
  return new Utils();
});

