function SessionsListCtrl($scope, params, map, sensors, storage, sessions, dialog, functionBlocker) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.sensors = sensors;
    $scope.sessions = sessions;
    functionBlocker.block("sessionDialog", !!$scope.params.get("tmpSensorId"));
  };

  $scope.openSensorDialog = function() {
    $scope.params.update({tmpSensorId: ""});
    var dialogObj = dialog();
    dialogObj.title('Select a Parameter - Sensor')
      .template("/partials/tmp_sensor_selection_dialog.html")
      .onClose(function(){
        if(!sensors.tmpSelected()){
          $scope.params.update({sessionsIds: []});
          var selectedSession = _($scope.sessions.get()).detect(function(session){
            return session.$selected;
          });
          if(selectedSession){
            selectedSession.$selected = false;
          }
        }
        $scope.$digest();
      })
      .opts({ width: 340, height: 'auto', resizable: false, modal:true, position: ["center", 100],
      buttons: {
        "OK": function() {
          $scope.sensors.proceedWithTmp();
          dialogObj.close();
        }
      }})
      .open();

    return dialog;
  };

  $scope.isSessionDisabled = function(session) {
    return !sensors.selected() && sessions.noOfSelectedSessions() > 0 &&
      !_(params.get("sessionsIds")).include(session.id);
  };

  $scope.sessionFetchCondition = function() {
    return {id:  sensors.selectedId(), params: params.getWithout('data', 'heat')};
  };
  $scope.$watch("sessionFetchCondition()", function(newValue, oldValue) {
    sessions.fetch();
  }, true);


  $scope.sessionRedrawCondition = function() {
    return {id: params.get('tmpSensorId'), heat:  params.get('data').heat };
  };
  $scope.$watch("sessionRedrawCondition()", function(newValue) {
    if(!newValue.id && !newValue.heat){
      return;
    }
    sessions.redraw();
  }, true);


  $scope.$watch("params.get('sessionsIds')", function(newIds, oldIds) {
    functionBlocker.use("sessionDialog", function(){
      if(newIds.length === 1 && !sensors.selected()) {
        $scope.openSensorDialog();
      }
    });
  }, true);


  //used to fetch all the sessions

  $scope.setDefaults();
}
SessionsListCtrl.$inject = ['$scope', 'params', 'map', 'sensors', 'storage', 'sessions', 'dialog', 'functionBlocker'];
