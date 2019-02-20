angular.module('aircasting').factory('empty', function() {
  var Empty = function() {
    this.array = [];
  };

  return new Empty();
});

