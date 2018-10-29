import moment from 'moment';

export const toDayOfYear = monthDay => {
  const doy = moment.duration(moment(monthDay, 'MM/DD') - moment('01/01', 'MM/DD')).asDays();
  return Math.ceil(doy);
};

export const toMonthDay = dayOfYear => {
  return moment('01/01', 'MM/DD').add('days', dayOfYear).format('MM/DD');
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
