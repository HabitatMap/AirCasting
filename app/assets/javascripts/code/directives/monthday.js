angular.module("aircasting").directive('monthday', function(){

  var viewToModel = function(viewValue) {
    return Math.ceil(moment.duration(moment(viewValue, "MM/DD") - moment("01/01",  "MM/DD")).asDays());
  };
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      ctrl.$formatters.unshift(function(modelValue) {
        return moment("01/01",  "MM/DD").add("days", modelValue).format('MM/DD');
      });
      ctrl.$parsers.unshift(viewToModel);
      $(element).datepicker({dateFormat: 'mm/dd',
                            onSelect: function(dateTxt, ui){
                              scope.$eval(attrs.ngModel + "=" + angular.toJson(viewToModel(dateTxt)));
                              scope.$digest();
                            }});
    }
  };
});



