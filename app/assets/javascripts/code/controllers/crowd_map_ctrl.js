function CrowdMapCtrl($scope, $routeParams, $http) {
  $scope.sensors = [];
  $scope.minResolution = 10;
  $scope.maxResolution = 50;
  $scope.minTime = 0;
  $scope.maxTime = 24 * 60 - 1;
  $scope.minDay = 1;
  $scope.maxDay = 365;

  $scope.master = {
    time: {
      timeFrom : $scope.minTime,
      timeTo : $scope.maxTime,
      dayFrom : $scope.minDay,
      dayTo : $scope.maxDay
    },
    gridResolution : 25
  };

  $scope.data = angular.copy($scope.master);

  $scope.expandables = {};
  $scope.toggle = function(name) {
    $scope.expandables[name] = $scope.expandables[name] ? undefined : "expanded";
  }
  //show some expandables
  _.each(['sensor', 'location', 'usernames'], function(name) {
    $scope.toggle(name);
  })

  $scope.update = function(formData) {
    $scope.master = angular.copy(formData);
  };

  $scope.reset = function(name) {
    $scope.data[name] = angular.copy($scope.master[name]);
  };

  $scope.onResolutionSlide = function(event, ui) {
    $scope.data.gridResolution = ui.value;
    $scope.$digest();
  }
  $scope.onMonthDaySlide = function(event, ui) {
    $scope.data.time.dayFrom = _.min(ui.values);
    $scope.data.time.dayTo = _.max(ui.values);
    $scope.$digest();
  }
  $scope.onTimeSlide = function(event, ui) {
    $scope.data.time.timeFrom = _.min(ui.values);
    $scope.data.time.timeTo = _.max(ui.values);
    $scope.$digest();
  }
  $scope.onSensorsFetch = function(data, status, headers, config) {
    _(data).each(function(sensor){
      sensor.id = sensor.measurement_type + "-" + sensor.sensor_name;
      sensor.label = sensor.measurement_type + " - " + sensor.sensor_name;
    });
    $scope.sensors = data;
  }

  $http.get('/api/sensors').success($scope.onSensorsFetch);
}
CrowdMapCtrl.$inject = ['$scope', '$routeParams', '$http'];
