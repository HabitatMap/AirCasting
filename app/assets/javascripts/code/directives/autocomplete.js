angular.module("aircasting").directive('autocomplete', function (){
  return {
    link: function(scope, element, attrs, controller) {
      $(element).autocomplete(attrs.autocomplete, {multiple: true, delay: 100});
    }
  };
});
