function SessionsGraphCtrl($scope, map, params, plotStorage) {
  $scope.plotStorage = plotStorage;
  $scope.expanded = false;
  $scope.params = params;

  $scope.toggle = function(){
    var sessionsSize = _(params.get('sessionsIds')).size();
    console.log(sessionsSize);
    if(sessionsSize == 0) {
      return; //TODO
    } else if(sessionsSize > 1) {
      return; //TODO
    }
    $scope.expanded = !$scope.expanded;
  };
  $scope.formattedEdge = function(edge){
    var data = plotStorage.getEdge(edge);
    return data ? moment(data).format("HH:mm:ss") : "";
  };

}
SessionsGraphCtrl.$inject = ['$scope', 'map', 'params', 'plotStorage'];

