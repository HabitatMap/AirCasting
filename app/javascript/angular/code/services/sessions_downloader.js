import { keysToLowerCase } from "../utils.js";

angular.module("aircasting").factory("sessionsDownloader", [
  "$rootScope",
  "$http",
  "$timeout",
  "orderByFilter",
  function($rootScope, $http, $timeout, orderBy) {
    var fetch = function(
      url,
      reqData,
      sessions,
      params,
      refreshSessionsCallback,
      errorCallback
    ) {
      var successCallback = function(data) {
        preprocessData(data.sessions, sessions, params);
        refreshSessionsCallback(data.fetchableSessionsCount);
      };
      fetchPage(url, reqData, successCallback, errorCallback);
    };

    var fetchPage = function(url, reqData, success, error) {
      $http
        .get(url, {
          cache: true,
          params: { q: reqData }
        })
        .success(success)
        .error(error);
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

    var preprocessData = function(data, sessions, params) {
      var times;
      var sessionIds = _(params.get("selectedSessionIds") || []);

      data = completeSessions(data);

      _(data).each(function(session) {
        if (session.start_time_local && session.end_time_local) {
          session.startTime = moment(session.start_time_local)
            .utc()
            .valueOf();
          session.endTime = moment(session.end_time_local)
            .utc()
            .valueOf();
        }

        session.streams = keysToLowerCase(session.streams);

        session.shortTypes = _(session.streams)
          .chain()
          .map(function(stream) {
            return {
              name: stream.measurement_short_type,
              type: stream.sensor_name
            };
          })
          .sortBy(function(shortType) {
            return shortType.name.toLowerCase();
          })
          .value();

        setDefaultSessionAttributes(session);
      });
      sessions.push.apply(sessions, data);
      sessions = orderBy(sessions, "end_time_local");

      if (params.get("selectedSessionIds").length === 0) {
        params.update({ fetchedSessionsCount: sessions.length });
      }
    };

    return fetch;
  }
]);

const setDefaultSessionAttributes = session => {
  session.markers = [];
  session.lines = [];
  session.noteDrawings = [];
};
