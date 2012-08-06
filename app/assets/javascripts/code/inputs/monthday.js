angular.module("aircasting").directive('monthday', function(){
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      ctrl.$formatters.unshift(function(modelValue) {
        return moment(new Date(2011, 1, 1)).add("days", (modelValue || 1) - 1).format('MM/DD');
      });
      ctrl.$parsers.unshift(function(viewValue) {
        return Date.parse(viewValue);
      });
      $(element).datepicker({dateFormat: 'mm/dd'});
    }
  };
});



