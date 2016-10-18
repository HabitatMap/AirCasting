angular.module("aircasting").factory("sessionsDownloader", ['$rootScope', '$http', '$timeout', 'orderByFilter', function ($rootScope, $http, $timeout, orderBy) {

  var fetch = function (url, reqData, sessions, params, refreshSessionsCallback, errorCallback) {
    var successCallback = function (data) {
      preprocessData(data, sessions, params);
      refreshSessionsCallback();
    };
    fetchPage(url, reqData, params.page, successCallback, errorCallback);
  };

  var fetchPage = function (url, reqData, page, success, error) {
    $http.get(url, {cache: true, params : {q: reqData, page: page}}).success(success).error(error);
  };

  var completeSessions = function(data) {
    var sessions = _.reject(data, function(session) {
      return _.isEmpty(session.streams);
    });

    sessions = _.reject(sessions, function(session) {
      return _.some(_.values(session.streams), function(stream) {
        return stream.size === 0;
      });
    });

    return sessions;
  };

  var preprocessData = function (data, sessions, params) {
    var times;
    var sessionIds = _(params.get('sessionsIds') || []);
    $rootScope.sessionsCount = data.length;

    data = completeSessions(data);

    _(data).each(function(session){
      if(session.start_time_local && session.end_time_local) {
        times = [moment(session.start_time_local, "YYYY-MM-DDTHH:mm:ss"),
                 moment(session.end_time_local, "YYYY-MM-DDTHH:mm:ss")];
        session.timeframe = times[0].format('MM/DD/YYYY, HH:mm') +
          '-' +  times[1].format('HH:mm');
      }
      session.availableStreams = session.streams;

      session.shortTypes = _(session.streams).chain().map(function(stream){
        return {name: stream.measurement_short_type, type: stream.sensor_name};
      }).sortBy(function(shortType) {
        return shortType.name.toLowerCase();
      }).value();

      session.$selected = sessionIds.include(session.id);
    });
    sessions.push.apply(sessions, data);
    sessions = orderBy(sessions, '$selected', 'end_time_local');
  };

  return fetch;
}]);
