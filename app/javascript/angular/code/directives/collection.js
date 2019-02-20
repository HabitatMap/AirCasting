angular.module("aircasting").directive('collection', function (){
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      var id = scope.$eval(attrs.collectionId);

      ctrl.$formatters.unshift(function(modelValue) {
        var collection = scope.params.get(attrs.collection, []);
        return _(collection).include(id);
      });

      ctrl.$parsers.push(function(viewValue) {
        var collection = scope.params.get(attrs.collection, []);
        if(viewValue) {
          if(!attrs.collectionCondition || scope.$eval(attrs.collectionCondition)) {
            collection.push(id);
          } else {
            element.attr("checked", false);
            return false;
          }
        } else {
          collection.splice(_(collection).indexOf(id), 1);
        }
        var result = {};
        result[attrs.collection] = collection;
        scope.params.update(result);
        return viewValue;
      });

    }
  };
});

