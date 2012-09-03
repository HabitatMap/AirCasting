function SessionsListCtrl($scope, params, map, sensors, storage, sessions, flash,
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
      .opts({ width: 340, height: 'auto', resizable: false, modal:true, position: ["center", "center"],
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
    return !sensors.selected() && !_(params.get("sessionsIds")).include(sessionId) &&
      !sessions.empty() ;
  };

  $scope.sessionFetchCondition = function() {
    return {id:  sensors.selectedId(), params: params.getWithout('data', 'heat')};
  };
  $scope.$watch("sessionFetchCondition()", function(newValue, oldValue) {
    sessions.fetch();
  }, true);

  $scope.canSelectSession = function(sessionId) {
    var session = sessions.find(sessionId);
    if(sessions.empty()){
      return true;
    }
    if(sessions.canSelectThatSession(session)){
      return true;
    }
    flash.set("You are trying to select too many sessions");
    return false;
  };

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
          sensors.tmpSensorId = _(usableSensors).first().id;
          $scope.openSensorDialog();
        } else {
          params.update({tmp: {tmpSensorId: _(usableSensors).first().id}});
        }
      } else {
        params.update({tmp: {tmpSensorId: ""}});
      }
    });
  }, true);

  $scope.toggleAll = function(){
    if(sessions.empty()) {
      if(!sensors.selectedId()) {
        flash.set("Filter by Parameter - Sensor to view many sessions at once");
        return;
      }
      if(sessions.canSelectAllSessions()){
        sessions.selectAllSessions();
      } else {
        flash.set("You are trying to select too many sessions");
      }
    } else {
      sessions.deselectAllSessions();
    }
  };

  $scope.allSelectionText = function() {
    return sessions.empty() ? "all" : "none";
  };

  $scope.toggleSession = function(sessionId) {
    if(this.isSessionDisabled(sessionId)){
      flash.set("Filter by Parameter - Sensor to view many sessions at once");
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
  $scope.shortTypeCss = function(name, selected){
    var result = name;
    if(selected) {
      var sensor = sensors.anySelected();
      if(sensor && name == sensor.sensor_name){
        result = result + " sensor-bold";
      }
    }
    return result;
  };

  $scope.sessionCssClass = function(selected) {
    return selected ? "selected" : "";
  };

  $scope.setDefaults();
}
SessionsListCtrl.$inject = ['$scope', 'params', 'map', 'sensors', 'storage',
  'sessions', 'flash', 'dialog', 'functionBlocker', 'singleSession', '$window'];
