function PanelCtrl($scope,  $location, expandables) {
  $scope.permalinkVisible = false;
  $scope.selectedTab = undefined;
  $scope.$location = $location;
  $scope.expandables = expandables;

  $scope.togglePermalink = function() {
    $scope.permalinkVisible = !$scope.permalinkVisible;
  };

  $scope.togglePanel = function() {
    $scope.expandables.allHidden = !$scope.expandables.allHidden;
  };

  $scope.goToMobileSessionsMap = function() {
    if($location.path() != "/map_sessions") {
      $location.search({});
      $location.url("/map_sessions");
    }
  };

  $scope.goToFixedSessionsMap = function() {
    if($location.path() != "/map_fixed_sessions") {
      $location.search({});
      $location.url("/map_fixed_sessions");
    }
  };

  $scope.goToCrowdMap = function() {
    if($location.path() != "/map_crowd") {
      $location.search({});
      $location.url("/map_crowd");
    }
  };

  $scope.$watch('$location.path()', function(newValue) {
    $scope.selectedTab = _.str.trim(newValue, "/");
  });

  $scope.tabClass = function(name) {
    return $scope.selectedTab == name ? "active" : "" ;
  };
}
PanelCtrl.$inject = ['$scope', '$location', 'expandables'];
