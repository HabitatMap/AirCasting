function SessionsGraphCtrl($scope, map, graph, flash, heat, sensors,
                           graphHighlight, $window, $timeout) {
  $scope.graph = graph;
  $scope.$window = $window;
  $scope.expanded = false;
  $scope.heat = heat;
  $scope.sensors = sensors;
  var singleSession = $scope.singleSession;

  function updateExpanded() {
    $scope.expanded = singleSession.isSingle() && !_.isEmpty(sensors.anySelected());
  }

  $scope.$watch('sensors.anySelected()', function() {
    console.log('watch - sensors.anySelected()');
    updateExpanded();
  });

  $scope.$watch('singleSession.isSingle()', function() {
    console.log('watch - singleSession.isSingle()');
    updateExpanded();
  });

  $scope.$watch('singleSession.get().loaded', function() {
    console.log('watch - singleSession.get().loaded');
    if ($scope.expanded && !_.isEmpty(singleSession.measurements())) {
      $scope.redraw();
    }
  });

  $scope.css = function() {
    return $scope.expanded ? "" : "collapsed";
  };
  $scope.$watch("expanded", function(expanded) {
    console.log("watch - expanded");
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
    console.log("watch - heat.getValues()");
    if($scope.shouldRedraw()){
      $scope.redraw();
    }
  }, true);

  $scope.redraw = function() {
    if(!singleSession.withSelectedSensor()) {
      return;
    }
    if(singleSession.isFixed())
      graph.getInitialData();
    else
      graph.draw(singleSession.measurementsToTime(), false);
  };
}
SessionsGraphCtrl.$inject = ['$scope', 'map',  'graph', 'flash', 'heat', 'sensors',
  'graphHighlight', '$window', '$timeout'];
angular.module('aircasting').controller('SessionsGraphCtrl', SessionsGraphCtrl);
