function CrowdMapCtrl($scope, $routeParams, $http, paramsManager, heat, utils) {
  $scope.params = paramsManager.get();

  $scope.setDefaults = function() {
    $scope.sensors = [];
    $scope.expandables = {};
    $scope.data = {};
    $scope.heatPercentage = {};
    $scope.minResolution = 10;
    $scope.maxResolution = 50;
    $scope.minTime = 0;
    $scope.maxTime = 24 * 60 - 1;
    $scope.minDay = 1;
    $scope.maxDay = 365;
    $scope.permalinkVisible = false;
    _.each(['sensor', 'location', 'usernames'], function(name) {
      $scope.toggle(name);
    })
    paramsManager.update({
      time: {
        timeFrom : $scope.minTime,
        timeTo : $scope.maxTime,
        dayFrom : $scope.minDay,
        dayTo : $scope.maxDay
      },
      heat:  heat.parse([0,1,2,3,4]),
      gridResolution : 25,
    });
  };

  //update form base on params
  $scope.$watch("params", function(newValue) {
    _.extend($scope.data, newValue.data);
  });

  //
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

  $scope.toggle = function(name) {
    $scope.expandables[name] = $scope.expandables[name] ? undefined : "expanded";
  };

  $scope.update = function(name) {
    paramsManager.update($scope.data[name]);
  };

  $scope.reset = function(name) {
    $scope.data[name] = angular.copy($scope.params[name]);
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
    $scope.sensors = data
    if(!$scope.selectedSensor){
      $scope.selectedSensor = _($scope.sensors).sortBy(function(sensor){
        return -1 * sensor.session_count;
      })[0];
    }
  }
  $scope.onThresholdsFetch = function(data, status, headers, config) {
    paramsManager.update({heat: heat.parse(data)})
  }

  $scope.setDefaults();
  $http.get('/api/sensors').success($scope.onSensorsFetch);
}
CrowdMapCtrl.$inject = ['$scope', '$routeParams', '$http', 'params', 'heat', 'utils'];
