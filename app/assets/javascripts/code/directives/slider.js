angular.module("aircasting").directive('slider', function (){
  return {
    link: function(scope, element, attrs, controller) {
      var opts = {
        range: attrs.sliderRange,
        min: scope[attrs.sliderMin] || 0,
        max: scope[attrs.sliderMax] || 0,
        step: _.str.toNumber(attrs.sliderStep) || 1,
        slide: attrs.sliderCallback &&  scope.$eval(attrs.sliderCallback)
      }
      if(opts.range) {
        opts.values = [opts.min, opts.max];
      }
      $(element).slider(opts);
      scope.$watch(attrs.sliderMin, function(newValue, oldValue) {
        if(!newValue) {
          return;
        }
        $(element).slider("option", "min", newValue);
      });
      scope.$watch(attrs.sliderMax, function(newValue, oldValue) {
        if(!newValue) {
          return;
        }
        $(element).slider("option", "max", newValue);
      });
      scope.$watch(attrs.sliderValue, function(newValue, oldValue) {
        if(!newValue) {
          return;
        }
        if(opts.range) {
          if(angular.equals($(element).slider("values"), newValue.split(','))){
            return;
          }
        } else {
          if(angular.equals($(element).slider("value"), newValue)){
            return;
          }
        }
        if(opts.range) {
          $(element).slider("values", newValue.split(","));
        }else {
          $(element).slider("value", newValue);
        }
      });
    }
  };
});
