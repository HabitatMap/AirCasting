function CrowdMapCtrl($scope, $http, params, heat, $window, map, sensors, expandables, storage, storageEvents) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.storageEvents = storageEvents;
    $scope.sensors = sensors;
    $scope.expandables = expandables;

    $scope.minResolution = 10;
    $scope.maxResolution = 50;

    _.each(['sensor', 'location', 'usernames'], function(name) {
      $scope.expandables.show(name);
    });
    $scope.params.update({data: {
      location: $scope.params.get('data').location || {},
      heat:  $scope.params.get('data').heat || heat.parse([0,1,2,3,4]),
      gridResolution : $scope.params.get('data').gridResolution || 25
    }});

    $scope.sensors.shouldInitSelected = true;
    $scope.sensors.initSelected();
  };

  $scope.$watch("params.get('data')", function(newValue, oldValue) {
    $scope.getAverages();
  }, true);

  $scope.$watch("params.get('data').location.address", function(newValue) {
    map.goToAddress(newValue);
  }, true);

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    if(!newValue){
      return;
    }
    $scope.params.update({data: {sensorId: newValue}});
    $http.get('/api/thresholds/' + sensors.selected().sensor_name).success($scope.onThresholdsFetch);
  });

  $scope.onThresholdsFetch = function(data, status, headers, config) {
    $scope.params.update({data: {heat: heat.parse(data)}});
  };
  $scope.onAveragesFetch = function(data, status, headers, config) {
    map.drawRectangles(data, _($scope.params.get('data').heat).values().sort(), $scope.onRectangleClick);
  };

  $scope.onRectangleClick = function() {
  };

  $scope.getAverages = function(){
    var data = $scope.params.get('data');
    if(!sensors.selected() || !data.time || !data.heat || !data.gridResolution || sensors.isEmpty()) {
      return;
    }
    var viewport = map.viewport();
    var reqData = {
      west: viewport.west,
      east: viewport.east,
      south: viewport.south,
      north: viewport.north,
      time_from: data.time.timeFrom,
      time_to:  data.time.timeTo,
      day_from:  data.time.dayFrom,
      day_to:  data.time.dayTo,
      year_from: 2011,
      year_to: 2020,
      grid_size_x: _.str.toNumber(data.gridResolution) * ($($window).width() / $($window).height()),
      grid_size_y:  data.gridResolution,
      tags:  data.tags,
      usernames:  data.usernames,
      sensor_name:  sensors.selected().sensor_name,
      measurement_type:  sensors.selected().measurement_type
    };
    $http.get('/api/averages', {params : {q: reqData}}).success($scope.onAveragesFetch);
  };
  $scope.setDefaults();
}
CrowdMapCtrl.$inject = ['$scope', '$http', 'params', 'heat',
  '$window', 'map', 'sensors', 'expandables', 'storage', 'storageEvents'];
