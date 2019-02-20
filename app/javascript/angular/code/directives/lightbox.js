angular.module("aircasting").directive('lightbox', function (){
  return {
    link: function(scope, element, attrs, controller) {
      $(element).lightBox();
    }
  };
});




