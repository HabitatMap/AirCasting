import moment from 'moment';

export const toDayOfYear = monthDay => {
  return moment(monthDay, 'MM/DD').dayOfYear();
};

export const toMonthDay = dayOfYear => {
  return moment('01/01', 'MM/DD').add(dayOfYear - 1, 'days').format('MM/DD');
};

export const monthday = () => {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      ctrl.$formatters.unshift(toMonthDay);
      ctrl.$parsers.unshift(toDayOfYear);

      const datePickerConfig = {
        dateFormat: 'mm/dd',
        onSelect: (dateTxt) => {
          scope.$eval(attrs.ngModel + '=' + angular.toJson(toDayOfYear(dateTxt)));
          scope.$digest();
        }
      };
      $(element).datepicker(datePickerConfig);
    }
  };
};
