function SessionsListCtrl($scope, params, map, sensors, storage, flash,
                          functionBlocker, $window, drawSession, openSensorDialog, markerSelected) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.$window = $window;
    $scope.sensors = sensors;
    $scope.page = 0;
    $scope.markerSelected = markerSelected;
    sessions = $scope.sessions;
    singleSession = $scope.singleSession;

    if(_(params.get("sessionsIds", [])).isEmpty()){
      params.update({sessionsIds: []});
    }

    functionBlocker.block("sessionDialog", !!$scope.params.get("tmp").tmpSensorId);
  };

  $scope.isSessionDisabled = function(sessionId) {
    return !sensors.selected() && !_(params.get("sessionsIds")).include(sessionId) &&
      !sessions.empty() ;
  };

  $scope.sessionFetchCondition = function() {
    return {id:  sensors.selectedId(), params: params.getWithout('data', 'heat')};
  };

  $scope.updateSessionsPage = function() {
    $scope.page++;
  };

  $scope.$watch("page", function() {
    console.log("watch - page");
    sessions.fetch($scope.page);
  }, true);

  $scope.$watch("sessionFetchCondition()", function(newValue, oldValue) {
    console.log("watch - sessionFetchCondition()");
    $scope.page = 0;
    sessions.fetch($scope.page);
  }, true);

  $scope.$watch("sensors.isEmpty()", function(newValue, oldValue) {
    console.log("watch - sensors.isEmpty()");
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
    return {id: params.get('tmp').tmpSensorId, heat: params.get('data').heat };
  };

  $scope.$watch("sessionRedrawCondition()", function(newValue) {
    console.log("watch - sessionRedrawCondition()");
    if(singleSession.isFixed() || (!newValue.id && !newValue.heat)){
      return;
    }
    drawSession.redraw(sessions.allSelected());
  }, true);

  $scope.$on('markerSelected', function(event, data){
    $scope.toggleSession(data.session_id, true);
  });

  $scope.$watch("params.get('sessionsIds')", function(newIds, oldIds) {
    console.log("watch - params.get('sessionsIds')");
    functionBlocker.use("sessionDialog", function(){
      if(newIds.length === 1 && !sensors.selected()) {
        var usableSensors = singleSession.availSensors();
        if(usableSensors.length > 1) {
          sensors.tmpSensorId = _(usableSensors).first().id;
          openSensorDialog(newIds, oldIds, sessions);
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

  $scope.toggleSession = function(sessionId, markerSelected) {
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
      $scope.markerSelected.set(markerSelected);
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
  'flash', 'functionBlocker', '$window', 'drawSession', 'openSensorDialog', 'markerSelected'];
