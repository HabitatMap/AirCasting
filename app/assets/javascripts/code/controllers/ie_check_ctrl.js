function IECheckCtrl($scope, $cookieStore) {
  $scope.visibleIE = $.browser.msie && !$cookieStore.get('no-ie-closed');

  $scope.closeIE = function() {
    $scope.visibleIE = false;
    $cookieStore.put('no-ie-closed', true);
  };
}
IECheckCtrl.$inject = ['$scope', '$cookieStore'];
