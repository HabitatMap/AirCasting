angular.module("aircasting").directive('httpSpinner', function () {
  return {
    restrict: 'E',

    link: function (scope, element, attrs) {
      const options = {
        lines: 12,
        length: 0,
        width: 15,
        radius: 34,
        color: '#000',
        speed: 1.5,
        trail: 42,
        shadow: true
      };
      const spinner = new Spinner(options);

      scope.$watch("$isHttpInProgress", function(isHttpInProgress) {
        if (isHttpInProgress){
          spinner.spin(element.context);
        } else {
          $("#" + attrs.overlay).hide();
          spinner.stop();
        }
      });
    }
  };
});
