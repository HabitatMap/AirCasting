angular.module("aircasting").directive('collection', function (){
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      var id = scope.$eval(attrs.collectionId);

      ctrl.$formatters.unshift(function(modelValue) {
        var collection = scope.$eval(attrs.collection) || [];
        return _(collection).include(id);
      });

      ctrl.$parsers.push(function(viewValue) {
        var collection = scope.$eval(attrs.collection) || [];
        if(viewValue) {
          collection.push(id);
        } else {
          collection.splice(_(collection).indexOf(id), 1);
        }
        return viewValue;
      });

    }
  };
});

