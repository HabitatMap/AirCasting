function SessionsGraphCtrl($scope, map, graph, flash, heat, sensors, singleSession,
                           graphHighlight, $window, $timeout) {
  $scope.graph = graph;
  $scope.$window = $window;
  $scope.expanded = false;
  $scope.heat = heat;
  $scope.sensors = sensors;
  $scope.singleSession = singleSession;

  $scope.$watch("sensors.anySelectedId()", function(id){
    $scope.expanded = false;
  });

  $scope.$watch("singleSession.id(true)", function(id){
    $scope.expanded = false;
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
        graph.redraw();
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
      graph.redraw();
    }
  }, true);
}
SessionsGraphCtrl.$inject = ['$scope', 'map',  'graph', 'flash', 'heat', 'sensors',
  'singleSession', 'graphHighlight', '$window', '$timeout'];


