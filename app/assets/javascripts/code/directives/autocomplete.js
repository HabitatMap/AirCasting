angular.module("aircasting").directive('autocomplete', function (){
  return {
    link: function(scope, element, attrs, controller) {
      $(element).autocomplete(attrs.autocompleteUrl, {multiple: true, delay: 100});
    }
  };
});
