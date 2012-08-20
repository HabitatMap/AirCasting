angular.module("aircasting").directive('monthday', function(){

  var viewToModel = function(viewValue) {
    return Math.ceil(moment.duration(moment(viewValue, "YY/MM/DD") - moment(new Date(2011, 0, 1))).asDays());
  };
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      ctrl.$formatters.unshift(function(modelValue) {
        return moment(new Date(2011, 0, 1)).add("days", modelValue).format('YY/MM/DD');
      });
      ctrl.$parsers.unshift(viewToModel);
      $(element).datepicker({dateFormat: 'y/mm/dd',
                            onSelect: function(dateTxt, ui){
                              scope.$eval(attrs.ngModel + "=" + angular.toJson(viewToModel(dateTxt)));
                              scope.$digest();
                            }});
    }
  };
});



