angular.module("aircasting").directive('heatbackground', function (){
  return {
    link: function(scope, element, attrs, controller) {
      scope.$watch(attrs.heatbackground, function(newValue) {
        console.log('watch - attrs.heatbackground');
        _(newValue).each(function(value,key){
          $(element).find("." + key).css({height: value.width });
        });
      }, true);
     }
  };
});


