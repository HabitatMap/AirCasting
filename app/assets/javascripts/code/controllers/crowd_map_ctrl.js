function CrowdMapCtrl($scope, $routeParams, $http) {
  $scope.sensors = [];
  $scope.expandables = {};
  $scope.heatPercentage = {};
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
    heat: {},
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

  $scope.update = function() {
    $scope.master = angular.copy($scope.data);
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
    $scope.data.heat = angular.copy($scope.data.heat); //todo: change watcher instead of this line
    $scope.$digest();
  }
  $scope.onHeatChangeHigh = function(event, ui) {
    $scope.data.heat.high = ui.value;
    $scope.data.heat = angular.copy($scope.data.heat);
    $scope.$digest();
  }
  $scope.onHeatChangeMid = function(event, ui) {
    $scope.data.heat.mid = ui.value;
    $scope.data.heat = angular.copy($scope.data.heat);
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
      })[0];
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

  $scope.$watch("selectedSensor", function(newValue, oldValue) {
    if(!newValue){
      return;
    }
    $http.get('/api/thresholds/' + newValue.sensor_name).success($scope.onThresholdsFetch);
  })

  $scope.$watch("data.heat", function(newValue, oldValue) {
    if(!newValue){
      return;
    }
    var value = newValue;
    var scale =  value.highest - value.lowest;
    var percentageHeat = {
     highest: Math.round(((value.highest - value.high) / scale) * 100),
     high :  Math.round(((value.high - value.mid) / scale) * 100),
     mid : Math.round(((value.mid - value.low) / scale) * 100)
    };
    percentageHeat.low =  (100 - percentageHeat.highest - percentageHeat.high - percentageHeat.mid);
    _(["highest", "high", "mid", "low"]).each(function(heat){
      $scope.heatPercentage[heat] = {width: percentageHeat[heat] + "%"};
    })
  })

  $scope.setDefaults();
  $http.get('/api/sensors').success($scope.onSensorsFetch);
}
CrowdMapCtrl.$inject = ['$scope', '$routeParams', '$http'];
