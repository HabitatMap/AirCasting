angular.module("aircasting").directive('timepicker', function(){
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      ctrl.$formatters.unshift(function(modelValue) {
        return _.str.rjust(Math.floor(modelValue / 60), 2, "0") + ":" + _.str.rjust((modelValue % 60), 2, "0");
      });
      ctrl.$parsers.unshift(function(viewValue) {
        var date = Date.parse(value);
        if(date) {
          return date.getMinutes() + 60 * date.getHours();
        }
      });
      $(element).timepicker();
    }
  };
});
