function NoteCtrl($scope, note, sessions) {
  $scope.note = note.data;
  var notes = sessions.find(note.data.session_id).notes;
  var total = _(notes).size();
  var noteNumber = parseInt(note.idx, 10) + 1;
  $scope.number = noteNumber + '/' + total;
}
NoteCtrl.$inject = ['$scope', 'note', 'sessions'];
