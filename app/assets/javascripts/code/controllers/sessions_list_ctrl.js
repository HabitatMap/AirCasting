function SessionsListCtrl($scope, $http, params, map, sensors, storage, sessions, dialog) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.sensors = sensors;
    $scope.sessions = sessions;
    params.update({sessionsIds: params.get('sessionsIds', [])});
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

  //used to fetch all the sessions
  $scope.$watch("params.get('data')", function() {
    sessions.fetch();
  }, true);

  //used for open tmp sensor dialogs
  $scope.$watch("params.get('sessionsIds')", function(newIds, oldIds) {
    if(newIds.length === 1 && !sensors.selected()) {
      $scope.openSensorDialog();
    }
  }, true);

  $scope.setDefaults();

}
SessionsListCtrl.$inject = ['$scope', '$http', 'params', 'map', 'sensors', 'storage', 'sessions', 'dialog'];
