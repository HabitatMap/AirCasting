angular.module("aircasting").directive('eventblur', function (){
  return {
    link: function(scope, element, attrs, controller) {
      $(element).bind('blur', function(event) {
        scope.$apply(attrs.eventblur);
        event.preventDefault();
      });
    }
  };
});
