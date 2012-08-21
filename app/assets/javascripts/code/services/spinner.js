angular.module("aircasting").factory('spinner', [
                                     function() {
  var SpinnerCounter = function() {
    this.counter = 0;
  };
  SpinnerCounter.prototype = {
    show: function() {
      this.counter = this.counter + 1;
    },

    hide: function() {
      if(this.counter > 0) {
        this.counter = this.counter - 1;
      }
    },
    visible: function(){
      return this.counter > 0;
    }
  };
  return new SpinnerCounter();
}]);
