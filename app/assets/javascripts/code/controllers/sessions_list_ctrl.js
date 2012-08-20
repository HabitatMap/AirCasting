function SessionsListCtrl($scope, $http, params, map, sensors, storage, sessions, dialog) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.sensors = sensors;
    $scope.sessions = sessions;

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

  $scope.isAbleToChange = function(session) {
    return session.$selected || sensors.selected() || (sessions.noOfSelectedSessions() === 0);
  };

  $scope.sessionFetchCondition = function() {
    return {id:  $scope.sensors.selectedId(), heat: $scope.params.getWithout('data', 'heat')};
  };

  $scope.sessionRedrawCondition = function() {
    return {heat:  $scope.params.get('data').heat, id: $scope.params.get('tmpSensorId')};
  };

  //used to fetch all the sessions
  $scope.$watch("sessionFetchCondition()", function() {
    sessions.fetch();
  }, true);


  //used for open tmp sensor dialogs
  $scope.$watch("params.get('sessionsIds')", function(newIds, oldIds) {
    if(newIds.length === 1 && !sensors.selected()) {
      $scope.openSensorDialog();
    }
  }, true);


  //used to fetch all the sessions
  $scope.$watch("sessionRedrawCondition()", function(newValue) {
    if(!newValue.id && !newValue.heat){
      return;
    }
    sessions.redraw();
  }, true);

  $scope.setDefaults();
}
SessionsListCtrl.$inject = ['$scope', '$http', 'params', 'map', 'sensors', 'storage', 'sessions', 'dialog'];
