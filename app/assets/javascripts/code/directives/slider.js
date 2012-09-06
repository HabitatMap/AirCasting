angular.module("aircasting").directive('slider', function (){
  return {
    link: function(scope, element, attrs, controller) {
      var opts = {
        min: scope[attrs.sliderMin] || 0,
        max: scope[attrs.sliderMax] || 0,
        animate: true,
        step: _.str.toNumber(attrs.sliderStep) || 1,
        slide: attrs.sliderOnslide && scope.$eval(attrs.sliderOnslide)
      };
      $(element).slider(opts);
      scope.$watch(attrs.sliderMin, function(newValue, oldValue) {
        if(!newValue) {
          return;
        }
        $(element).slider("option", "min", newValue);
        $(element).slider("value", $(element).slider("value"));
      }, true);
      scope.$watch(attrs.sliderMax, function(newValue, oldValue) {
        if(!newValue) {
          return;
        }
        $(element).slider("option", "max", newValue);
        $(element).slider("value", $(element).slider("value"));
      }, true);
      scope.$watch(attrs.sliderValue, function(newValue, oldValue) {
        if(!newValue) {
          return;
        }
        if(angular.equals($(element).slider("value"), newValue)){
          return;
        }
        $(element).slider("value", newValue);
      }, true);
    }
  };
});
