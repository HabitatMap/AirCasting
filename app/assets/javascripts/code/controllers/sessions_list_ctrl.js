function SessionsListCtrl($scope, params, map, sensors, storage, flash, versioner,
                          dialog, functionBlocker, $window) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.$window = $window;
    $scope.sensors = sensors;
    sessions = $scope.sessions;
    singleSession = $scope.singleSession;

    if(_(params.get("sessionsIds", [])).isEmpty()){
      params.update({sessionsIds: []});
    }

    functionBlocker.block("sessionDialog", !!$scope.params.get("tmp").tmpSensorId);
  };

  $scope.openSensorDialog = function(newIds, oldIds) {
    $scope.params.update({tmp: {tmpSensorId: ""}});
    var dialogObj = dialog();
    dialogObj.title('Select a Parameter - Sensor')
      .template(versioner.path("/partials/tmp_sensor_selection_dialog.html"))
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
        sessions.sessionsChanged(newIds, oldIds);
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

  $scope.$watch("sensors.isEmpty()", function(newValue, oldValue) {
    sessions.reSelectAllSessions();
  }, true);

  $scope.canSelectSession = function(sessionId) {
    var session = sessions.find(sessionId);
    if(sessions.empty()){
      return true;
    }
    if(sessions.canSelectThatSession(session)){
      return true;
    }
    flash.set(sessions.scope.canNotSelectSessionWithSensorSelected);
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
          $scope.openSensorDialog(newIds, oldIds);
        } else if(usableSensors.length === 1){
          params.update({tmp: {tmpSensorId: _(usableSensors).first().id}});
          sessions.sessionsChanged(newIds, oldIds);
        }
      } else {
        params.update({tmp: {tmpSensorId: ""}});
        sessions.sessionsChanged(newIds, oldIds);
      }
    });
  }, true);

  $scope.toggleAll = function(){
    if(sessions.empty()) {
      if(!sensors.selectedId()) {
        flash.set(sessions.scope.canNotSelectSessionWithoutSensorSelected);
        return;
      }
      if(sessions.canSelectAllSessions()){
        sessions.selectAllSessions();
      } else {
        flash.set(sessions.scope.canNotSelectSessionWithSensorSelected);
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
      flash.set(sessions.scope.canNotSelectSessionWithoutSensorSelected);
      return;
    }
    var session = sessions.find(sessionId);
    if(sessions.isSelected(session)) {
      params.update({sessionsIds: _(params.get("sessionsIds", [])).without(sessionId)});
      session.$selected = false;
    } else if($scope.canSelectSession(sessionId)) {
      params.update({sessionsIds: params.get("sessionsIds", []).concat([sessionId])});
      session.$selected = true;
    }
  };

  $scope.canExportSessions = function() {
    return (true === params.get('didSessionsSearch', false));
  };

  $scope.exportSessions = function() {
    sessions.export();
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
  'flash', 'versioner', 'dialog', 'functionBlocker', '$window'];
