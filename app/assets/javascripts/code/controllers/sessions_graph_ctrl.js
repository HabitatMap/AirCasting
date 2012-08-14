function SessionsGraphCtrl($scope, map, params, plotStorage, flash, heat, sensors) {
  $scope.plotStorage = plotStorage;
  $scope.expanded = false;
  $scope.params = params;
  $scope.heat = heat;
  $scope.sensors = sensors;

  $scope.css = function() {
    return $scope.expanded ? "" : "collapsed";
  };

  $scope.toggle = function(){
    var sessionsSize = _(params.get('sessionsIds')).size();
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

}
SessionsGraphCtrl.$inject = ['$scope', 'map', 'params', 'plotStorage', 'flash', 'heat', 'sensors'];

