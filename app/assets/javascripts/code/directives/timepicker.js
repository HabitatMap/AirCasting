angular.module("aircasting").directive('timepicker', function(){
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      var viewToModel = function(viewValue) {
        var date = moment(viewValue,"HH:MM");
        if(date) {
          return date.minutes() + 60 * date.hours() + scope.utils.timeOffset;
        }
      };
      ctrl.$formatters.unshift(function(modelValue) {
        var correctedValue = modelValue - scope.utils.timeOffset;
        return _.str.rjust(Math.floor(correctedValue / 60), 2, "0") + ":" + _.str.rjust((correctedValue % 60), 2, "0");
      });
      ctrl.$parsers.unshift(viewToModel);
      $(element).timepicker({
        onSelect: function(timeTxt, ui){
          scope.$eval(attrs.ngModel + "=" + angular.toJson(viewToModel(timeTxt)));
          scope.$digest();
      }});
    }
  };
});
