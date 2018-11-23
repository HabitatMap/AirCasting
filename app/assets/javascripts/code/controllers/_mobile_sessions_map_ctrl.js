import _ from 'underscore';

export const MobileSessionsMapCtrl = (
  $scope,
  params,
  map,
  sensors,
  expandables,
  storage,
  mobileSessions,
  versioner,
  storageEvents,
  singleMobileSession,
  functionBlocker,
  $window,
  rectangles,
  infoWindow,
  sensorsList
) => {
  sensors.setSensors(sensorsList);
  $scope.setDefaults = function() {
    $scope.versioner = versioner;
    $scope.params = params;
    $scope.storage = storage;
    $scope.storageEvents = storageEvents;
    $scope.sensors = sensors;
    $scope.expandables = expandables;
    $scope.sessions = mobileSessions;
    $scope.singleSession = singleMobileSession;
    $scope.$window = $window;

    functionBlocker.block("sessionHeat", !_(params.get('selectedSessionIds')).isEmpty());

    rectangles.clear();
    infoWindow.hide();
    map.unregisterAll();
    map.removeAllMarkers();

    if (process.env.NODE_ENV !== 'test') {
      $($window).resize(function() {
        $scope.$digest();
      });
    }

    ['sensor', 'location', 'usernames', 'layers'].forEach(function(name) {
      $scope.expandables.show(name);
    });

    storage.updateDefaults({
      sensorId: "",
      location: {address: ""},
      tags: "",
      usernames: ""
    });

    storage.updateFromDefaults();
  };

  $scope.searchSessions = function() {
    storage.updateWithRefresh('location');
    params.update({'didSessionsSearch': true});
  };

  $scope.$watch("params.get('data').sensorId", function(newValue) { sensors.onSelectedSensorChange(newValue); }, true);

  $scope.$watch("sensors.selectedId()", function(newValue, oldValue) {
    sensors.onSensorsSelectedIdChange(newValue, oldValue, false);
  }, true);

  $scope.heatUpdateCondition = function() {
    return {sensorId:  sensors.anySelectedId(), sessionId: $scope.singleSession.id()};
  };
  $scope.$watch("heatUpdateCondition()", function(newValue, oldValue) {
    console.log("watch - heatUpdateCondition() - ", newValue, " - ", oldValue);
    if(newValue.sensorId && newValue.sessionId){
      functionBlocker.use("sessionHeat", function(){
        $scope.singleSession.updateHeat();
      });
    }
  }, true);

  $scope.$watch("sensors.selectedParameter", function(newValue, oldValue) {
    sensors.onSelectedParameterChange(newValue, oldValue);
  }, true);

  $scope.$watch("{location: params.get('data').location.address, counter: params.get('data').counter}",
    function(newValue) {
      console.log("watch - {location: params.get('data').location.address, counter: params.get('data').counter}");
      map.goToAddress(newValue.location);
    }, true);

  $scope.setDefaults();
}
