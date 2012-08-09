function PanelCtrl($scope,  $location) {
  $scope.permalinkVisible = false;
  $scope.panelVisible = true;
  $scope.selectedTab = undefined;
  $scope.$location = $location;

  $scope.togglePermalink = function() {
    $scope.permalinkVisible = !$scope.permalinkVisible;
  };

  $scope.togglePanel = function() {
    $scope.panelVisible = !$scope.panelVisible;
  };

  $scope.goToSessionsMap = function() {
    $location.url("/map_sessions");
  };

  $scope.goToCrowdMap = function() {
    $location.url("/map_crowd");
  };

  $scope.$watch('$location.path()', function(newValue) {
    $scope.selectedTab = _.str.trim(newValue, "/");
  });

  $scope.tabClass = function(name) {
    return $scope.selectedTab == name ? "active" : "" ;
  };
}
PanelCtrl.$inject = ['$scope', '$location'];
