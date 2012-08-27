function SessionsListCtrl($scope, params, map, sensors, storage, sessions,
                          dialog, functionBlocker, singleSession, $window) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.$window = $window;
    $scope.sensors = sensors;
    $scope.sessions = sessions;
    if(_(params.get("sessionsIds", [])).isEmpty()){
      params.update({sessionsIds: []});
    }

    functionBlocker.block("sessionDialog", !!$scope.params.get("tmp").tmpSensorId);
  };

  $scope.openSensorDialog = function() {
    $scope.params.update({tmp: {tmpSensorId: ""}});
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
        "submit": function() {
          $scope.sensors.proceedWithTmp();
          dialogObj.close();
        }
      }})
      .open();

    return dialog;
  };

  $scope.isSessionDisabled = function(sessionId) {
    var session = sessions.find(sessionId);
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
    return {id: params.get('tmp').tmpSensorId, heat:  params.get('data').heat };
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
        var usableSensors = singleSession.availSensors();
        if(usableSensors.length > 1) {
          $scope.openSensorDialog();
        } else {
          params.update({tmp: {tmpSensorId: _(usableSensors).first().id}});
        }
      } else {
        params.update({tmp: {tmpSensorId: ""}});
      }
    });
  }, true);


  $scope.toggleSession = function(sessionId) {
    if(this.isSessionDisabled(sessionId)){
      return;
    }
    var session = sessions.find(sessionId);
    if(sessions.isSelected(session)) {
      params.update({sessionsIds: _(params.get("sessionsIds", [])).without(sessionId)});
      session.$selected = false;
    } else {
      params.update({sessionsIds: params.get("sessionsIds", []).concat([sessionId])});
      session.$selected = true;
    }
  };

  //used to fetch all the sessions

  $scope.setDefaults();
}
SessionsListCtrl.$inject = ['$scope', 'params', 'map', 'sensors', 'storage',
  'sessions', 'dialog', 'functionBlocker', 'singleSession', '$window'];
