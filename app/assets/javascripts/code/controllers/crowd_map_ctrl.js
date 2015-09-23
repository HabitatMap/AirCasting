function CrowdMapCtrl($scope, $http, params, heat, $window, map, sensors, expandables, $location, versioner,
                      storage, storageEvents, infoWindow, rectangles, spinner, functionBlocker, utils, flash) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.versioner = versioner;
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
    map.unregisterAll();
    map.register("idle", $scope.getAverages);

    functionBlocker.block("heat", !_(params.get('data').heat).isEmpty());

    $scope.getAverages();
  };

  $scope.$watch("{location: params.get('data').location.address, counter: params.get('data').counter}",
    function(newValue) {
    map.goToAddress(newValue.location);
  }, true);

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    if(!newValue){
      return;
    }
    params.update({data: {sensorId: newValue}});
    spinner.show();
    $http.get('/api/thresholds/' + sensors.selected().sensor_name, {params: {unit_symbol: sensors.selected().unit_symbol}, cache: true}).success($scope.onThresholdsFetch);
  });

  $scope.onThresholdsFetch = function(data, status, headers, config) {
    storage.updateDefaults({heat:  heat.parse(data)});
    functionBlocker.use("heat", function(){
      params.update({data: {heat: heat.parse(data)}});
    });
    $scope.getAverages();
    spinner.hide();
  };

  $scope.$watch("params.get('data')", function(newValue, oldValue) {
    infoWindow.hide();
    $scope.getAverages();
  }, true);

  $scope.getAverages = function(){
    var data = params.get('data');
    var bounder = map.viewport();
    if(!sensors.selected() || !data.time || !data.heat || !data.gridResolution || !bounder.east) {
      return;
    }
    var reqData = $scope.averagesData(bounder);
    spinner.show();
    $http.get('/api/averages', {cache: true, params : {q: reqData}}).error($scope.onError).success($scope.onAveragesFetch);
  };

  $scope.onError = function() {
    spinner.hide();
    flash.set('There was an error, sorry');
  };

  $scope.averagesData = function(bounder) {
    var data = params.get('data');
    return {
      west: bounder.west,
      east: bounder.east,
      south: bounder.south,
      north: bounder.north,
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
      measurement_type:  sensors.selected().measurement_type,
      unit_symbol:  sensors.selected().unit_symbol
    };
  };

  $scope.onAveragesFetch = function(data, status, headers, config) {
    spinner.hide();
    if($location.path() == "/map_crowd"){
       map.drawRectangles(data,
                       _(params.get('data').heat).chain().values().sortBy(function(i){return i;}).value(),
                       $scope.onRectangleClick);
    }
  };

  $scope.onRectangleClick = function(rectangleData) {
    var paramsToSend = $scope.averagesData(rectangleData);
    infoWindow.show("/api/region", paramsToSend, rectangles.position(rectangleData));
    $scope.$digest();
  };

  $scope.setDefaults();
}
CrowdMapCtrl.$inject = ['$scope', '$http', 'params', 'heat',
  '$window', 'map', 'sensors', 'expandables', '$location', 'versioner', 'storage',
  'storageEvents', 'infoWindow', 'rectangles', 'spinner', 'functionBlocker', 'utils', 'flash'];
