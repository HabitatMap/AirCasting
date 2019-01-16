import moment from 'moment';

const toTime = scope => viewValue => {
  const date = moment(viewValue,"HH:MM");
  if(date) {
    return date.minutes() + 60 * date.hours() + scope.utils.timeOffset;
  }
};

const toString = scope => modelValue => {
  const correctedValue = modelValue - scope.utils.timeOffset;
  return _.str.rjust(Math.floor(correctedValue / 60), 2, "0") + ":" + _.str.rjust((correctedValue % 60), 2, "0");
}

export const timepicker = () => {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      ctrl.$formatters.unshift(toString(scope));
      ctrl.$parsers.unshift(toTime(scope));

      const datePickerConfig = {
        onSelect: function(timeTxt){
          scope.$eval(attrs.ngModel + "=" + angular.toJson(toTime(scope)(timeTxt)));
          scope.$digest();
        }
      };
      $(element).timepicker(datePickerConfig);
    }
  };
}
