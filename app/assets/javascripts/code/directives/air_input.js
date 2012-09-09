angular.module("aircasting").directive('airinput', function(){
  return {
    link: function(scope, element, attrs, ctrl) {
      var hidden = $(element).siblings(':hidden');
      scope.$watch(hidden.attr("ng-model") ,function(newValue){
        $(element).val(newValue);
      });
      $(element).bind("blur", function() {
        scope.$apply(hidden.attr("ng-model")  + " = " + $(this).val());
        if(attrs.airinputBlur) {
          scope.$apply(attrs.airinputBlur);
        }
      });
    }
  };
});



