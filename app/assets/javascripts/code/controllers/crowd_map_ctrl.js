function CrowdMapCtrl($scope, $routeParams, timeFormats) {
  $scope.expandables = {};
  $scope.master = {};
  $scope.local = {};

  $scope.minResolution = 10;
  $scope.maxResolution = 50;
  $scope.gridResolution = 25;

  $scope.minTime = 0;
  $scope.maxTime = 24 * 60 - 1;
  $scope.minDay = 1
  $scope.maxDay = 365

  $scope.timeFrom = $scope.minTime
  $scope.timeTo = $scope.maxTime
  $scope.dayFrom = $scope.minDay
  $scope.dayTo = $scope.maxDay

  $scope.toggle = function(name) {
    $scope.expandables[name] = $scope.expandables[name] ? undefined : "expanded";
  }

  _.each(['sensor', 'location', 'usernames'], function(name) {
    $scope.toggle(name);
  })

  $scope.update = function(local) {
    $scope.master = angular.copy(local);
  };

  $scope.reset = function(name) {
    $scope.local[name] = angular.copy($scope.master[name]);
  };

  $scope.onResolutionSlide = function(event, ui) {
    $scope.gridResolution = ui.value;
    $scope.$digest();
  }
  $scope.onMonthDaySlide = function(event, ui) {
    $scope.dayFrom = ui.values[0];
    $scope.dayTo = ui.values[1];
    $scope.$digest();
  }
  $scope.onTimeSlide = function(event, ui) {
    $scope.timeFrom = ui.values[0];
    $scope.timeTo = ui.values[1];
    $scope.$digest();
  }
}
CrowdMapCtrl.$inject = ['$scope', '$routeParams'];
