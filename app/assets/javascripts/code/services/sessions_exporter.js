angular.module("aircasting").factory("sessionsExporter", ['$window', function ($window) {

  var fetch = function (sessionIds) {
    var url = downloadUrl(sessionIds);
    $window.open(url, '_blank', '');
  };

  var downloadUrl = function(selectedSessionIds) {
    var sessionIdsStr = _(selectedSessionIds).map(function(sessionId) {
      return 'session_ids[]='+sessionId
    }).join('&');

    return ('/api/sessions/export.json?' + sessionIdsStr);
  };

  return fetch;
}]);

