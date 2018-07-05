angular.module("aircasting").directive('airinput', function(){
  return {
    link: function(scope, element, attrs) {
      var hidden = $(element).siblings(':hidden');
      scope.$watch(hidden.attr("ng-model") ,function(newValue){
        console.log('watch - hidden.attr("ng-model")');
        $(element).val(newValue);
      });
      $(element).bind("change", function() {
        scope.$apply(hidden.attr("ng-model")  + " = " + $(this).val());
        scope.$apply(attrs.airinputCallback);
      });
    }
  };
});



