function NoteCtrl($scope, note, sessions) {
  $scope.note = note.data;
  $scope.note.dateLocalTime = moment($scope.note.date, "YYYY-MM-DDTHH:mm:ss").format('MM/DD/YYYY, HH:mm');
  var notes = sessions.find(note.data.session_id).notes;
  var total = _(notes).size();
  var noteNumber = parseInt(note.idx, 10) + 1;
  $scope.number = noteNumber + '/' + total;
}
NoteCtrl.$inject = ['$scope', 'note', 'sessions'];
