angular.module("aircasting").factory('digester', ['$timeout', '$rootScope', function($timeout, $rootScope) {
  return function(){
    $timeout(function(){
      $rootScope.$digest();
    });
  };
}]);

