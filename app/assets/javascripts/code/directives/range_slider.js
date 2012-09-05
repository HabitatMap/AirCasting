angular.module("aircasting").directive('rangeslider', function (){
  return {
    link: function(scope, element, attrs, controller) {
      var opts = {
        range: true,
        min: scope[attrs.sliderMin] || 0,
        max: scope[attrs.sliderMax] || 0,
        step: _.str.toNumber(attrs.sliderStep) || 1,
        slide: attrs.sliderOnslide && scope.$eval(attrs.sliderOnslide)
      };
      opts.values = [opts.min, opts.max];
      $(element).slider(opts);
      scope.$watch(attrs.sliderMin, function(newValue, oldValue) {
        if(!newValue) {
          return;
        }
        $(element).slider("option", "min", newValue);
      }, true);
      scope.$watch(attrs.sliderMax, function(newValue, oldValue) {
        if(!newValue) {
          return;
        }
        $(element).slider("option", "max", newValue);
      }, true);
      scope.$watch(attrs.sliderValue, function(newValue, oldValue) {
        if(!newValue) {
          return;
        }
        if(angular.equals($(element).slider("values"), newValue.split(','))){
          return;
        }
        $(element).slider("values", newValue.split(","));
      }, true);
    }
  };
});
