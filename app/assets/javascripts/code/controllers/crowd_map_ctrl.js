function CrowdMapCtrl($scope, $routeParams, $http, paramsManager, heat, utils, $window, googleMapManager) {
  $scope.setDefaults = function() {
    $scope.params = paramsManager.get();
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
      time:  _($scope.params.data.time).isEmpty() ? {
        timeFrom : $scope.minTime,
        timeTo : $scope.maxTime,
        dayFrom : $scope.minDay,
        dayTo : $scope.maxDay
      } : $scope.params.data.time,
      heat:  $scope.params.data.heat || heat.parse([0,1,2,3,4]),
      gridResolution : $scope.params.data.gridResolution || 25,
    });
  };

  //update form base on params
  $scope.$watch("params.data", function(newValue) {
    _.extend($scope.data, newValue);
  });

  //
  $scope.$watch("params.data.sensorId", function(newValue, oldValue) {
    if(!newValue || _($scope.sensors).size() == 0){
      return;
    }
    $http.get('/api/thresholds/' + $scope.sensors[newValue].sensor_name).success($scope.onThresholdsFetch);
    //$scope.getAverages();
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
    var obj = {}
    obj[name] = $scope.data[name];
    paramsManager.update(obj);
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
    var sensors = {}
    _(data).each(function(sensor){
      sensor.id = sensor.measurement_type + "-" + sensor.sensor_name;
      sensor.label = sensor.measurement_type + " - " + sensor.sensor_name;
      sensors[sensor.id] = sensor;
    });
    $scope.sensors = sensors;
    if(!$scope.params.data.sensorId){
      $scope.params.data.sensorId = _($scope.sensors).chain().keys().sortBy(function(sensorId){
        return -1 * $scope.sensors[sensorId].session_count;
      }).first().value();
    }
  }
  $scope.onThresholdsFetch = function(data, status, headers, config) {
    paramsManager.update({heat: heat.parse(data)})
  }
  $scope.onAveragesFetch = function(data, status, headers, config) {
  }
  $scope.getAverages = function(){
    var viewport = googleMapManager.viewport();
    var paramsData = $scope.params.data;
    var data = {
      west: viewport.west,
      east: viewport.east,
      south: viewport.south,
      north: viewport.north,
      time_from: paramsData.time.timeFrom,
      time_to:  paramsData.time.timeTo,
      day_from:  paramsData.time.dayFrom,
      day_to:  paramsData.time.dayTo,
      year_from: 2011,
      year_to: 2020,
      grid_size_x: _.str.toNumber(paramsData.gridResolution) * ($($window).width() / $($window).height()),
      grid_size_y:  paramsData.gridResolution,
      tags:  paramsData.tags,
      usernames:  paramsData.usernames,
      sensor_name:  $scope.sensors[paramsData.sensorId].sensor_name,
      measurement_type:  $scope.sensors[paramsData.sensorId].measurement_type
    }
    $http.get('/api/averages', data).success($scope.onAveragesFetch);
  }
  $scope.setDefaults();
  $http.get('/api/sensors').success($scope.onSensorsFetch);
}
CrowdMapCtrl.$inject = ['$scope', '$routeParams', '$http', 'params', 'heat', 'utils', '$window', 'googleMapManager'];
