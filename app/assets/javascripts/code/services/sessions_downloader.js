angular.module("aircasting").factory("sessionsDownloader", ['$http', function ($http) {

  var fetch = function (reqData, sessions, params, refreshSessionsCallback, errorCallback) {
    var page = 0;
    var successCallback = function (data) {
      page++;
      if (data.length > 0) {
        preprocessData(data, sessions, params);
        refreshSessionsCallback();
        setTimeout(function () {fetchPage(reqData, page, successCallback, errorCallback)}, 100);
      }
    }
    fetchPage(reqData, page, successCallback, errorCallback);
  }

  var fetchPage = function (reqData, page, success, error) {
    $http.get('/api/sessions.json', {cache: true, params : {q: reqData, page: page}}).success(success).error(error);
  }

  var preprocessData = function (data, sessions, params) {
    var times;
    var sessionIds = _(params.get('sessionsIds') || []);
    _(data).each(function(session){
      if(session.start_time_local && session.end_time_local) {
        times = [moment(session.start_time_local, "YYYY-MM-DDTHH:mm:ss"),
                 moment(session.end_time_local, "YYYY-MM-DDTHH:mm:ss")];
        if(session.start_time_local > session.end_time_local){
          times = _(times).reverse();
        }
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
  }

  return fetch;
}]);

