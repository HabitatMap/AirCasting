function FlashCtrl($scope, flash,  $timeout) {
  $scope.flash = flash;
  $scope.$watch("flash.message", function(newValue){
    console.log("watch - flash.message");
    if(newValue){
      $timeout($scope.clear, 5000);
    }
  });
  $scope.clear = function() {
   flash.clear();
  };
}
FlashCtrl.$inject = ['$scope', 'flash', '$timeout'];
angular.module('aircasting').controller('FlashCtrl', FlashCtrl);
