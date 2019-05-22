function NoteCtrl($scope, note, mobileSessions, sessionsUtils) {
  var session = sessionsUtils.selectedSession(mobileSessions);

  $scope.note = note.data;
  $scope.note.dateLocalTime = moment(
    $scope.note.date,
    "YYYY-MM-DDTHH:mm:ss"
  ).format("MM/DD/YYYY, HH:mm:ss");
  var notes = session.notes;
  var total = _(notes).size();
  var noteNumber = parseInt(note.idx, 10) + 1;
  $scope.number = noteNumber + "/" + total;
}
NoteCtrl.$inject = ["$scope", "note", "mobileSessions", "sessionsUtils"];
angular.module("aircasting").controller("NoteCtrl", NoteCtrl);
