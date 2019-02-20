function NoteCtrl($scope, note, singleMobileSession) {
  var session = singleMobileSession.get();

  $scope.note = note.data;
  $scope.note.dateLocalTime = moment($scope.note.date, "YYYY-MM-DDTHH:mm:ss").format('MM/DD/YYYY, HH:mm:ss');
  var notes = session.notes;
  var total = _(notes).size();
  var noteNumber = parseInt(note.idx, 10) + 1;
  $scope.number = noteNumber + '/' + total;
}
NoteCtrl.$inject = ['$scope', 'note', 'singleMobileSession'];
angular.module('aircasting').controller('NoteCtrl', NoteCtrl);
