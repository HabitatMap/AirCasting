angular.module("aircasting").factory('utils', function() {
  return {
    clear: function(obj){
      _.keys(obj, function(prop) {
        delete obj[prop];
      });
    }
  };
});

