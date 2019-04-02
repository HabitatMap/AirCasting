import _str from 'underscore.string';

angular.module("aircasting").factory('utils', ['$window', function($window) {
  var Utils = function() {};
  Utils.prototype = {
    // supports simple merging for object , primitives and arrays (no functions, dates etc)
    merge : function(source, obj2) {
      var self = this;
      var obj1 = angular.copy(source);
      _(obj2).each(function(value, key){
        var bothAreObjects = angular.isObject(obj1[key]) && angular.isObject(value) &&
                             !angular.isArray(obj1[key]) && !angular.isArray(value);
        if(_(obj1).has(key) && bothAreObjects){
          obj1[key] = self.merge(obj1[key], value);
        } else {
          obj1[key] = angular.copy(value);
        }
      });
      return obj1;
    },
    gridSizeX: function(x) {
      return _str.toNumber(x) * $($window).width() / $($window).height();
    },
    heats: function(heat) {
      return _(heat).chain().values().sortBy(function(i){return i;}).value();
    }
  };
  return new Utils();
}]);
