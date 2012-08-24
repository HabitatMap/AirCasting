function CrowdMapCtrl($scope, $http, params, heat, $window, map, sensors, expandables, $location,
                      storage, storageEvents, infoWindow, rectangles, spinner, functionBlocker, utils) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.storageEvents = storageEvents;
    $scope.sensors = sensors;
    $scope.expandables = expandables;

    $scope.minResolution = 10;
    $scope.maxResolution = 50;

    _.each(['sensor', 'location', 'usernames'], function(name) {
      expandables.show(name);
    });

    storage.updateDefaults({
      location: {},
      gridResolution : 25,
      tags: "",
      usernames: ""
    });

    storage.updateFromDefaults();

    sensors.shouldInitSelected = true;
    sensors.initSelected();

    //refresh averages whenever you move on map
    map.listen("idle", $scope.getAverages);

    functionBlocker.block("heat", !_(params.get('data').heat).isEmpty());
  };

  $scope.$watch("params.get('data').location.address", function(newValue) {
    map.goToAddress(newValue);
  }, true);

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    if(!newValue){
      return;
    }
    params.update({data: {sensorId: newValue}});
    spinner.show();
    $http.get('/api/thresholds/' + sensors.selected().sensor_name, {cache: true}).success($scope.onThresholdsFetch);
  });

  $scope.onThresholdsFetch = function(data, status, headers, config) {
    storage.updateDefaults({heat:  heat.parse(data)});
    functionBlocker.use("heat", function(){
      params.update({data: {heat: heat.parse(data)}});
    });
    spinner.hide();
  };

  $scope.$watch("params.get('data')", function(newValue, oldValue) {
    infoWindow.hide();
    $scope.getAverages();
  }, true);

  $scope.getAverages = function(){
    var data = params.get('data');
    if(!sensors.selected() || !data.time || !data.heat || !data.gridResolution) {
      return;
    }
    var viewport = map.viewport();
    var reqData = {
      west: viewport.west,
      east: viewport.east,
      south: viewport.south,
      north: viewport.north,
      time_from: utils.normalizeTime(data.time.timeFrom),
      time_to:  utils.normalizeTime(data.time.timeTo),
      day_from:  data.time.dayFrom,
      day_to:  data.time.dayTo,
      year_from: data.time.yearFrom,
      year_to: data.time.yearTo,
      grid_size_x: _.str.toNumber(data.gridResolution) * ($($window).width() / $($window).height()),
      grid_size_y:  data.gridResolution,
      tags:  data.tags,
      usernames:  data.usernames,
      sensor_name:  sensors.selected().sensor_name,
      measurement_type:  sensors.selected().measurement_type
    };
    spinner.show();
    $http.get('/api/averages', {cache: true, params : {q: reqData}}).success($scope.onAveragesFetch);
  };

  $scope.getSessionIds = function(){
    return _(rectangles.getData()).chain().pluck("ids").map(function(ids){
      return ids.split(",");
    }).flatten().uniq().value();
  };

  $scope.onAveragesFetch = function(data, status, headers, config) {
    if($location.path() == "/map_crowd"){
       map.drawRectangles(data,
                       _(params.get('data').heat).chain().values().sortBy(function(i){return i;}).value(),
                       $scope.onRectangleClick);
    }
    spinner.hide();
  };

  $scope.onRectangleClick = function(rectangleData) {
    infoWindow.show("/api/region", rectangleData, rectangles.position(rectangleData));
    $scope.$digest();
  };

  $scope.setDefaults();
}
CrowdMapCtrl.$inject = ['$scope', '$http', 'params', 'heat',
  '$window', 'map', 'sensors', 'expandables', '$location', 'storage',
  'storageEvents', 'infoWindow', 'rectangles', 'spinner', 'functionBlocker', 'utils'];
