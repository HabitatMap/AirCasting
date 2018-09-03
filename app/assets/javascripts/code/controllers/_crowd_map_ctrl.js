import _ from 'underscore';

export const CrowdMapCtrl = (
  $scope,
  $http,
  params,
  heat,
  $window,
  map,
  sensors,
  expandables,
  $location,
  versioner,
  storage,
  storageEvents,
  infoWindow,
  rectangles,
  functionBlocker,
  utils,
  flash,
  markersClusterer,
  sensorsList
) => {
  sensors.setSensors(sensorsList);
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.versioner = versioner;
    $scope.storage = storage;
    $scope.storageEvents = storageEvents;
    $scope.sensors = sensors;
    $scope.expandables = expandables;

    $scope.minResolution = 10;
    $scope.maxResolution = 50;

    markersClusterer.clear();

    _.each(['sensor', 'location', 'usernames'], function(name) {
      expandables.show(name);
    });

    storage.updateDefaults({
      sensorId: sensors.defaultSensor,
      location: {},
      gridResolution : 25,
      tags: "",
      usernames: ""
    });

    storage.updateFromDefaults();

    //refresh averages whenever you move on map
    map.unregisterAll();
    map.register("idle", $scope.getAverages);
    map.removeAllMarkers();

    functionBlocker.block("heat", !_(params.get('data').heat).isEmpty());

    $scope.getAverages();
  };

  $scope.$watch("{location: params.get('data').location.address, counter: params.get('data').counter}",
    function(newValue) {
    console.log("watch - {location: params.get('data').location.address, counter: params.get('data').counter}");
    map.goToAddress(newValue.location);
  }, true);

  $scope.$watch("params.get('data').sensorId", function(newValue) { sensors.onSelectedSensorChange(newValue); }, true);

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    sensors.onSensorsSelectedIdChange(newValue, oldValue, $scope.onThresholdsFetch);
  });

  $scope.onThresholdsFetch = function(data, status, headers, config) {
    storage.updateDefaults({heat:  heat.parse(data)});
    functionBlocker.use("heat", function(){
      params.update({data: {heat: heat.parse(data)}});
    });
    $scope.getAverages();
  };

  $scope.$watch("params.get('data')", function(newValue, oldValue) {
    console.log("watch - params.get('data')");
    infoWindow.hide();
    $scope.getAverages();
  }, true);

  $scope.getAverages = function(){
    var data = params.get('data');
    var bounds = map.getBounds();
    if(!sensors.selected() || !data.time || !data.heat || !data.gridResolution || !bounds.east) {
      return;
    }
    var reqData = $scope.averagesData(bounds);
    $http.get('/api/averages', {cache: true, params : {q: reqData}}).error($scope.onError).success($scope.onAveragesFetch);
  };

  $scope.onError = function() {
    flash.set('There was an error, sorry');
  };

  $scope.averagesData = function(bounds) {
    var data = params.get('data');
    return {
      west: bounds.west,
      east: bounds.east,
      south: bounds.south,
      north: bounds.north,
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

  $scope.$watch("sensors.selectedParameter", function(newValue, oldValue) {
    sensors.onSelectedParameterChange(newValue, oldValue);
  }, true);

  $scope.setDefaults();
}
