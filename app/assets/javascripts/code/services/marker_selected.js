angular.module('aircasting').factory('markerSelected', function() {
  var MarkerSelected = function() {
    this.markerSelected = false;
  };

  MarkerSelected.prototype = {
    get: function(){
      return this.markerSelected;
    },

    set: function(value){
      this.markerSelected = value;
    }
  };

  return new MarkerSelected();
});
