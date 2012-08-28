function SessionsGraphCtrl($scope, map, plotStorage, flash, heat, sensors, singleSession) {
  $scope.plotStorage = plotStorage;
  $scope.expanded = false;
  $scope.heat = heat;
  $scope.sensors = sensors;

  $scope.$watch("sensors.anySelectedId()", function(id){
    $scope.expanded = false;
  });

  $scope.$watch("singleSession.id()", function(id){
    $scope.expanded = false;
  });

  $scope.css = function() {
    return $scope.expanded ? "" : "collapsed";
  };

  $scope.toggle = function(){
    var sessionsSize = singleSession.noOfSelectedSessions();
    if(sessionsSize === 0) {
      flash.set("Please select one session to view the graph");
      return;
    } else if(sessionsSize > 1) {
      flash.set("You can have only one session selected to view the graph. Currently you have " + sessionsSize);
      return;
    }
    $scope.expanded = !$scope.expanded;
  };
  $scope.formattedEdge = function(edge){
    var data = plotStorage.getEdge(edge);
    return data ? moment(data).format("HH:mm:ss") : "";
  };

  $scope.onPlotHover = function(event, pos, item){
    if(item === null){
      $scope.hideHighlight();
    } else {
      $scope.showHighlight(pos.x);
    }
  };

  $scope.onPlotMove = function(event, move){
    console.log(plotStorage.plot.getData());
    var options = plotStorage.plot.getOptions();
  };

  $scope.showHighlight = function(time){
    var index = _(singleSession.measurementsToTime()).sortedIndex([time, null], function(d) {
      return _.first(d);
    });
    var measurement = singleSession.measurements()[index];
    $scope.hideHighlight();
    $scope.highlight = map.drawMarker(measurement, null, $scope.highlight);
  };

  $scope.hideHighlight = function(){
    if(!$scope.highlight){
      return;
    }
    map.removeMarker($scope.highlight);
    delete $scope.highlight;
  };

  $scope.shouldRedraw = function() {
    return singleSession.isSingle() && !!sensors.anySelected() && !!singleSession.get().loaded;
  };

  $scope.$watch("shouldRedraw()", function(ready) {
    if(ready){
      plotStorage.redraw();
    }
  }, true);

  $scope.$watch("heat.getValues()", function() {
    if($scope.shouldRedraw()){
      plotStorage.redraw();
    }
  }, true);
}
SessionsGraphCtrl.$inject = ['$scope', 'map',  'plotStorage', 'flash', 'heat', 'sensors', 'singleSession'];


