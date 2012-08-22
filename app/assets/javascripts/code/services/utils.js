angular.module("aircasting").factory('utils', function() {
  var Utils = function() {
    this.timeOffset = (new Date()).getTimezoneOffset();
  };
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
    normalizeTime: function(time) {
      var minutes = 1440;
      if(time < 0){
        return minutes + time;
      } else {
        return time % minutes;
      }
    }
  };
  return new Utils();
});

