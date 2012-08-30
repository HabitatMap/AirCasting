function NoteCtrl($scope, note, sessions) {
  $scope.note = note.data;
  var notes = sessions.find(note.data.session_id).notes;
  $scope.total = _(notes).size();
  $scope.idx = note.idx;
  $scope.next = function(){
    $scope.idx = _([$scope.idx + 1, $scope.total - 1]).min();
    $scope.note = notes[$scope.idx];
  };
  $scope.prev = function(){
    $scope.idx = _([$scope.idx - 1, 0]).max();
    $scope.note = notes[$scope.idx];
  };
}
NoteCtrl.$inject = ['$scope', 'note', 'sessions'];
