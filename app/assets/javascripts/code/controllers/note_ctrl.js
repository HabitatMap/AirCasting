function NoteCtrl($scope, note, sessions) {
  $scope.note = note.data;
  var notes = sessions.find(note.data.session_id).notes;
  var total = _(notes).size();
  $scope.number = note.idx + '/' + total;
}
NoteCtrl.$inject = ['$scope', 'note', 'sessions'];
