function CrowdMapCtrl($scope, $routeParams, $http) {
  $scope.sensors = [];
  $scope.expandables = {};
  $scope.minResolution = 10;
  $scope.maxResolution = 50;
  $scope.minTime = 0;
  $scope.maxTime = 24 * 60 - 1;
  $scope.minDay = 1;
  $scope.maxDay = 365;
  $scope.permalinkVisible = false;
  $scope.master = {
    time: {
      timeFrom : $scope.minTime,
      timeTo : $scope.maxTime,
      dayFrom : $scope.minDay,
      dayTo : $scope.maxDay
    },
    heat: {
    },
    gridResolution : 25
  };

  $scope.setDefaults = function() {
    _.each(['sensor', 'location', 'usernames'], function(name) {
      $scope.toggle(name);
    })
    $scope.master.heat = $scope.parseHeat([0,1,2,3,4]);
    $scope.data = angular.copy($scope.master);
  }

  $scope.toggle = function(name) {
    $scope.expandables[name] = $scope.expandables[name] ? undefined : "expanded";
  }

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
  $scope.onHeatChangeLow = function(event, ui) {
    $scope.data.heat.low = ui.value;
    $scope.$digest();
  }
  $scope.onHeatChangeHigh = function(event, ui) {
    $scope.data.heat.high = ui.value;
    $scope.$digest();
  }
   $scope.onHeatChangeMid = function(event, ui) {
    $scope.data.heat.mid = ui.value;
    $scope.$digest();
  }
  $scope.onSensorsFetch = function(data, status, headers, config) {
    _(data).each(function(sensor){
      sensor.id = sensor.measurement_type + "-" + sensor.sensor_name;
      sensor.label = sensor.measurement_type + " - " + sensor.sensor_name;
    });
    $scope.sensors = data;
    if(!$scope.selectedSensor){
      $scope.selectedSensor = _($scope.sensors).sortBy(function(sensor){
        return -1 * sensor.session_count;
      })[0].id;
    }
  }

  $scope.onThresholdsFetch = function(data, status, headers, config) {
    $scope.master.heat = $scope.parseHeat(data);
    $scope.reset("heat");
  }

  $scope.parseHeat = function(heat) {
    var parsedHeat = _(heat).map(function(item){
      return _.str.toNumber(item);
    })
    return {highest: parsedHeat[4], high: parsedHeat[3], mid: parsedHeat[2], low: parsedHeat[1], lowest: parsedHeat[0]};
  }

  $scope.setDefaults();
  $http.get('/api/sensors').success($scope.onSensorsFetch);

  $scope.$watch("selectedSensor", function(newValue, oldValue) {
    if(!newValue){
      return;
    }
    $http.get('/api/thresholds/' + _(newValue.split("-")).last()).success($scope.onThresholdsFetch);
  })

}
CrowdMapCtrl.$inject = ['$scope', '$routeParams', '$http'];
