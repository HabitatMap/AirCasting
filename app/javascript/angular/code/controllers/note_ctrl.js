function NoteCtrl($scope, note, mobileSessions) {
  $scope.note = note.data;
  $scope.note.dateLocalTime = moment(
    $scope.note.date,
    "YYYY-MM-DDTHH:mm:ss"
  ).format("MM/DD/YYYY, HH:mm:ss");
  var notes = mobileSessions.selectedSession.notes;
  var total = _(notes).size();
  var noteNumber = parseInt(note.idx, 10) + 1;
  $scope.number = noteNumber + "/" + total;
}
NoteCtrl.$inject = ["$scope", "note", "mobileSessions"];
angular.module("aircasting").controller("NoteCtrl", NoteCtrl);
