angular.module("aircasting").factory('functionBlocker', function() {
  var FunctionBlocker = function() {
    this.data = {};
  };
  FunctionBlocker.prototype = {
    block : function(name, condition) {
      if(condition) {
        this.data[name] = true;
      }
    },

    use: function(name, fn){
      if(this.data[name]) {
        this.data[name] = false;
      } else {
        fn();
      }
      var self = this;
    }
  };
  return new FunctionBlocker();
});

