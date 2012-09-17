angular.module("aircasting").directive('plot', function (){
  return {
    link: function(scope, element, attrs, controller) {
      scope.graph.init(attrs.id);
      element.bind('mouseleave', function() {
        scope.graph.onMouseLeave();
      });
    }
  };
});




