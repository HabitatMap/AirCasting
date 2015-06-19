angular.module("aircasting").directive('spinner', function (){
  return {
    link: function(scope, element, attrs, controller) {
      var spinnerOpts = {
        lines: 12,
        length: 0,
        width: 15,
        radius: 34,
        color: '#000',
        speed: 1.5,
        trail: 42,
        shadow: true
      };
      var target = document.getElementById(attrs.id);
      var overlay = $("#" + attrs.spinner);
      var spinnerInst = new Spinner(spinnerOpts);
      scope.$watch("spinner.visible()", function(newValue, oldValue){
        if(newValue){
          spinnerInst.spin(target);
        } else {
          overlay.hide();
          spinnerInst.stop();
        }
      }, true);
    }
  };
});
