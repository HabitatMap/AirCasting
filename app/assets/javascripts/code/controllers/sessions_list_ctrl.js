function SessionsListCtrl($scope, $http, params, map, sensors, storage, sessions, dialog) {
  $scope.setDefaults = function() {
    $scope.params = params;
    $scope.storage = storage;
    $scope.sensors = sensors;
    $scope.sessions = sessions;
    $scope.list = [];
    params.update({sessionsIds: params.get('sessionsIds', [])});
  };

  $scope.openSensorDialog = function() {
    var dialogObj = dialog();
    dialogObj.title('Select a Parameter - Sensor')
      .template("/partials/tmp_sensor_selection_dialog.html")
      .onClose(function(){
        if(!sensors.tmpSelected()){
          $scope.params.update({sessionsIds: []});
          console.log(params.get("sessionsIds"))
          var selectedSession = _($scope.list).detect(function(session){
            return session.$selected;
          })
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
    return session.$selected || sensors.selected() || (params.get('sessionsIds').length === 0);
  };

  $scope.$watch("params.get('data')", function() {
    sessions.fetch($scope.onSessionsFetch);
  }, true);

  $scope.$watch("params.get('sessionsIds')", function(newIds, oldIds) {
    if(newIds.length === 1 && !sensors.selected()) {
      $scope.openSensorDialog();
    }
    $scope.params.update({sessionsIds: newIds});
  }, true);

  $scope.onSessionsFetch = function(data, status, headers, config) {
    _(data).each(function(session){
      if(session.start_time_local && session.end_time_local) {
        session.timeframe = moment(session.start_time_local).format('MM/DD/YYYY, HH:mm') +
            '-' +  moment(session.end_time_local).format('HH:mm');
      }
      session.shortTypes = _(session.streams).chain().map(function(stream){
        return {name: stream.measurement_short_type, type: stream.sensor_name};
      }).sortBy(function(shortType) {
        return shortType.name.toLowerCase();
      }).value();
    });
    $scope.list = data;
  };

  $scope.setDefaults();

}
SessionsListCtrl.$inject = ['$scope', '$http', 'params', 'map', 'sensors', 'storage', 'sessions', 'dialog'];
