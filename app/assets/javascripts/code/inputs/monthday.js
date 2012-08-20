angular.module("aircasting").directive('monthday', function(){
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      ctrl.$formatters.unshift(function(modelValue) {
        return moment(new Date(2011, 0, 1)).add("days", modelValue).format('MM/DD/YY');
      });
      ctrl.$parsers.unshift(function(viewValue) {
        return Date.parse(viewValue);
      });
      $(element).datepicker({dateFormat: 'mm/dd/yy'});
    }
  };
});



