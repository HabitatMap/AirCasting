function SessionsGraphCtrl($scope, map, graph, flash, heat, sensors,
                           graphHighlight, $window, $timeout) {
  $scope.graph = graph;
  $scope.$window = $window;
  $scope.expanded = false;
  $scope.heat = heat;
  $scope.sensors = sensors;
  singleSession = $scope.singleSession;

  function updateExpanded() {
    $scope.expanded = singleSession.isSingle() && !_.isEmpty(sensors.anySelected());
  }

  $scope.$watch('sensors.anySelected()', function() {
    updateExpanded();
  });

  $scope.$watch('singleSession.isSingle()', function() {
    updateExpanded();
  });

  $scope.$watch('singleSession.measurements()', function() {
    if ($scope.expanded && !_.isEmpty(singleSession.measurements())) {
      $scope.redraw();
    }
  });

  $scope.css = function() {
    return $scope.expanded ? "" : "collapsed";
  };
  $scope.$watch("expanded", function(expanded) {
    if(!expanded){
      graphHighlight.hide();
    } else {
      $timeout(function(){
        $($window).trigger("resize");
        $scope.redraw();
      });
    }
  });
  $scope.toggle = function(){
    var sessionsSize = singleSession.noOfSelectedSessions();
    if(sessionsSize === 0) {
      flash.set("Please select one session to view the graph");
      return;
    } else if(sessionsSize > 1) {
      flash.set("You can have only one session selected to view the graph. Currently you have " + sessionsSize);
      return;
    } else if(!singleSession.get().loaded) {
      flash.set("You need to wait till session be loaded");
      return;
    }
    $scope.expanded = !$scope.expanded;
  };

  $scope.shouldRedraw = function() {
    return singleSession.isSingle() && !!sensors.anySelected() && !!singleSession.get().loaded;
  };

  $scope.$watch("heat.getValues()", function() {
    if($scope.shouldRedraw()){
      $scope.redraw();
    }
  }, true);

  $scope.redraw = function() {
    if(!singleSession.withSelectedSensor()) {
      return;
    }
    graph.draw(singleSession.measurementsToTime(), singleSession.isFixed());
  }
}
SessionsGraphCtrl.$inject = ['$scope', 'map',  'graph', 'flash', 'heat', 'sensors',
  'graphHighlight', '$window', '$timeout'];
